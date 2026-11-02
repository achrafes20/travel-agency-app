package com.agence.voyage.service;

import com.agence.voyage.config.PaymentProperties;
import com.agence.voyage.entity.*;
import com.agence.voyage.exception.*;
import com.agence.voyage.repository.*;
import com.fasterxml.jackson.databind.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.http.HttpStatus;
import org.springframework.dao.DataIntegrityViolationException;
import jakarta.persistence.*;
import javax.crypto.*;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.*;
import java.math.BigDecimal;
import java.util.*;

@Service
public class PaymentWebhookService {
 private final PaymentProperties properties;private final Clock clock;private final ObjectMapper mapper;
 private final PaymentDataGuard guard;private final PaymentRepository payments;private final WebhookEventRepository webhooks;
 private final BookingRepository bookings;private final BookingService bookingService;private final PaymentLedger ledger;
 private final TransactionTemplate tx;private final EntityManager em;
 public PaymentWebhookService(PaymentProperties properties,Clock clock,ObjectMapper mapper,PaymentDataGuard guard,
 PaymentRepository payments,WebhookEventRepository webhooks,BookingRepository bookings,BookingService bookingService,
 PaymentLedger ledger,PlatformTransactionManager manager,EntityManager em){
  this.properties=properties;this.clock=clock;this.mapper=mapper;this.guard=guard;this.payments=payments;this.webhooks=webhooks;
  this.bookings=bookings;this.bookingService=bookingService;this.ledger=ledger;this.tx=new TransactionTemplate(manager);this.em=em;
 }
 public String signature(byte[] body){
  try{Mac mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec(properties.webhookSecret().getBytes(StandardCharsets.UTF_8),"HmacSHA256"));return HexFormat.of().formatHex(mac.doFinal(body));}
  catch(Exception e){throw new IllegalStateException("Signature impossible",e);}
 }
 private void verify(byte[] body,String signature,String timestamp){
  try{
   Instant received=Instant.ofEpochSecond(Long.parseLong(timestamp));
   if(received.isBefore(clock.instant().minusSeconds(properties.webhookToleranceSeconds()))||received.isAfter(clock.instant().plusSeconds(properties.webhookToleranceSeconds())))throw new IllegalArgumentException();
   byte[] provided=HexFormat.of().parseHex(signature==null?"":signature.replaceFirst("^sha256=",""));
   if(!MessageDigest.isEqual(provided,HexFormat.of().parseHex(signature(body))))throw new IllegalArgumentException();
  }catch(Exception e){throw new BusinessException(ErrorCode.INVALID_WEBHOOK_SIGNATURE,HttpStatus.UNAUTHORIZED,"Signature ou horodatage du webhook invalide");}
 }
 public record Reply(String status,String eventId){}
 public Reply receive(byte[] body,String signature,String timestamp){
  if(body.length>16384)throw new BusinessException(ErrorCode.BAD_REQUEST,"Événement trop volumineux");
  verify(body,signature,timestamp);
  JsonNode event;
  try{event=mapper.readTree(body);}catch(Exception e){throw new BusinessException(ErrorCode.BAD_REQUEST,"Événement JSON invalide");}
  if(event==null||!event.isObject())throw new BusinessException(ErrorCode.BAD_REQUEST,"Événement JSON invalide");
  guard.inspect(event);
  String eventId=event.path("eventId").asText(""),type=event.path("type").asText("");
  if(!eventId.matches("[A-Za-z0-9_-]{1,100}")||type.length()>64)throw new BusinessException(ErrorCode.BAD_REQUEST,"Identifiant ou type d'événement invalide");
  try{return tx.execute(status->process(event,eventId,type,PaymentIdempotency.sha256(new String(body,StandardCharsets.UTF_8))));}
  catch(DataIntegrityViolationException duplicate){
   if(Boolean.TRUE.equals(tx.execute(s->webhooks.findByProviderAndEventId("SANDBOX",eventId).isPresent())))return new Reply("IGNORED",eventId);
   throw duplicate;
  }catch(RuntimeException failure){
   tx.executeWithoutResult(status->rememberFailure(event,eventId,type,PaymentIdempotency.sha256(new String(body,StandardCharsets.UTF_8))));
   throw failure;
  }
 }
 private void rememberFailure(JsonNode event,String eventId,String type,String hash){
  if(webhooks.findByProviderAndEventId("SANDBOX",eventId).isPresent())return;
  WebhookEvent row=new WebhookEvent();row.setProvider("SANDBOX");row.setEventId(eventId);row.setType(type);row.setPayloadHash(hash);
  row.setReceivedAt(LocalDateTime.now(clock));row.setProcessedAt(row.getReceivedAt());row.setStatus("FAILED");webhooks.save(row);
  payments.findByProviderReference(event.path("providerReference").asText("")).ifPresent(p->ledger.event(p,p.getStatus(),"WEBHOOK_FAILED",null,"{}"));
 }
 private Reply process(JsonNode event,String eventId,String type,String hash){
  String reference=event.path("providerReference").asText("");
  Payment candidate=payments.findByProviderReference(reference).orElse(null);
  if(candidate!=null)bookings.lockById(candidate.getBooking().getId()).orElseThrow();
  if(webhooks.findByProviderAndEventId("SANDBOX",eventId).isPresent())return new Reply("IGNORED",eventId);
  WebhookEvent row=new WebhookEvent();row.setProvider("SANDBOX");row.setEventId(eventId);row.setType(type);row.setPayloadHash(hash);row.setReceivedAt(LocalDateTime.now(clock));row.setStatus("RECEIVED");webhooks.saveAndFlush(row);
  boolean processed=false;
  if(candidate!=null){
   Payment p=payments.lockById(candidate.getId()).orElseThrow();em.refresh(p,LockModeType.PESSIMISTIC_WRITE);
   ledger.event(p,p.getStatus(),"WEBHOOK_RECEIVED",null,"{}");
   Booking b=p.getBooking();
   if(type.equals("payment.succeeded")&&(p.getStatus()==PaymentStatus.PENDING||p.getStatus()==PaymentStatus.PROCESSING)
     &&p.getMethod()==PaymentMethod.CARD&&b.getStatus()==BookingStatus.PENDING
     &&(b.getExpiresAt()==null||!b.getExpiresAt().isBefore(LocalDateTime.now(clock)))){
    if(event.has("amount")&&event.get("amount").decimalValue().compareTo(p.getAmount())!=0)throw new BusinessException(ErrorCode.INVALID_AMOUNT,"Le montant du fournisseur ne correspond pas à la réservation");
    p.setPaidAt(LocalDateTime.now(clock));ledger.change(p,PaymentStatus.PAID,"PAID",null);b.setStatus(BookingStatus.CONFIRMED);b.setConfirmedAt(LocalDateTime.now(clock));b.setExpiresAt(null);ledger.confirmed(b);processed=true;
   }else if(type.equals("payment.failed")&&(p.getStatus()==PaymentStatus.PENDING||p.getStatus()==PaymentStatus.PROCESSING)){
    p.setFailureCode("PROVIDER_DECLINED");p.setFailureMessage("Le paiement a été refusé par le fournisseur");
    ledger.change(p,PaymentStatus.FAILED,"FAILED",null);processed=true;
   }else if(type.equals("payment.refunded")&&PaymentLedger.captured(p)){
    BigDecimal refunded=event.has("refundedAmount")?event.get("refundedAmount").decimalValue():p.getAmount();
    if(refunded.scale()>2||refunded.signum()<0||refunded.compareTo(p.getAmount())>0||refunded.add(p.getReservedRefundAmount()).compareTo(p.getAmount())>0)
     throw new BusinessException(ErrorCode.REFUND_EXCEEDS_PAID,"Montant de remboursement fournisseur invalide");
    if(refunded.compareTo(p.getRefundedAmount())>0){
     p.setRefundedAmount(refunded);p.setRefundedAt(LocalDateTime.now(clock));boolean full=refunded.compareTo(p.getAmount())==0;
     ledger.change(p,full?PaymentStatus.REFUNDED:PaymentStatus.PARTIALLY_REFUNDED,"REFUNDED",null);
     if(full)bookingService.cancelAfterRefund(b,null,"Remboursement confirmé par le fournisseur");processed=true;
    }
   }
  }
  row.setStatus(processed?"PROCESSED":"IGNORED");row.setProcessedAt(LocalDateTime.now(clock));
  return new Reply(row.getStatus(),eventId);
 }
}

