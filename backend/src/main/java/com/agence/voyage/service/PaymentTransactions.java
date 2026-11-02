package com.agence.voyage.service;

import com.agence.voyage.dto.*;
import com.agence.voyage.entity.*;
import com.agence.voyage.exception.*;
import com.agence.voyage.repository.*;
import jakarta.persistence.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import java.math.*;
import java.time.*;

@Service
@Transactional
public class PaymentTransactions {
 private final PaymentRepository payments;private final BookingRepository bookings;private final UserRepository users;
 private final IdempotencyRecordRepository records;private final PaymentIdempotency idempotency;
 private final PaymentLedger ledger;private final BookingService bookingService;private final AuditService audit;
 private final Clock clock;private final EntityManager em;
 private final com.fasterxml.jackson.databind.ObjectMapper mapper;
 public PaymentTransactions(PaymentRepository payments,BookingRepository bookings,UserRepository users,
  IdempotencyRecordRepository records,PaymentIdempotency idempotency,PaymentLedger ledger,
  BookingService bookingService,AuditService audit,Clock clock,EntityManager em,com.fasterxml.jackson.databind.ObjectMapper mapper){
  this.payments=payments;this.bookings=bookings;this.users=users;this.records=records;
  this.idempotency=idempotency;this.ledger=ledger;this.bookingService=bookingService;this.audit=audit;this.clock=clock;this.em=em;this.mapper=mapper;
 }
 public record Plan(Long recordId,Long paymentId,String reference,BigDecimal amount,boolean replay,PaymentReply immediate){}
 public record Settlement(PaymentReply reply,boolean compensate){}
 private BusinessException conflict(ErrorCode code,String message){return new BusinessException(code,HttpStatus.CONFLICT,message);}
 private String details(String note,BigDecimal amount){
  try{return mapper.writeValueAsString(java.util.Map.of("amount",amount,"reason",note==null?"":note));}
  catch(com.fasterxml.jackson.core.JsonProcessingException e){throw new IllegalStateException("Détails de traçabilité impossibles",e);}
 }
 private User actor(Long id){return users.findById(id).orElseThrow(()->new ResourceNotFoundException("Utilisateur introuvable"));}
 private Booking book(Long id){return bookings.lockById(id).orElseThrow(()->new BusinessException(ErrorCode.BOOKING_NOT_FOUND,HttpStatus.NOT_FOUND,"Réservation introuvable"));}
 private Payment payment(Long id){
  Payment p=payments.lockById(id).orElseThrow(()->new BusinessException(ErrorCode.PAYMENT_NOT_FOUND,HttpStatus.NOT_FOUND,"Paiement introuvable"));
  em.refresh(p,LockModeType.PESSIMISTIC_WRITE);return p;
 }
 private Payment lockPaymentAndBooking(Long id){
  Long bookingId=payments.findById(id).map(p->p.getBooking().getId()).orElseThrow(()->new BusinessException(ErrorCode.PAYMENT_NOT_FOUND,HttpStatus.NOT_FOUND,"Paiement introuvable"));
  book(bookingId);return payment(id);
 }
 private void owner(User user,Booking booking){
  if(user.getRole()!=Role.CLIENT||!booking.getClient().getId().equals(user.getId()))
   throw new BusinessException(ErrorCode.PAYMENT_NOT_FOUND,HttpStatus.NOT_FOUND,"Paiement ou réservation introuvable");
 }
 private void live(Booking booking){
  if(booking.getStatus()==BookingStatus.CANCELLED||booking.getStatus()==BookingStatus.EXPIRED||booking.getStatus()==BookingStatus.COMPLETED
    || booking.getExpiresAt()!=null&&booking.getExpiresAt().isBefore(LocalDateTime.now(clock)))
   throw conflict(ErrorCode.BOOKING_NOT_PAYABLE,"Cette réservation ne peut plus être réglée");
 }
 private Plan plan(PaymentIdempotency.Claim claim,Payment p,PaymentReply immediate){
  claim.record().setPaymentId(p.getId());return new Plan(claim.record().getId(),p.getId(),p.getProviderReference(),p.getAmount(),claim.replay(),immediate);
 }
 public Plan prepare(Long userId,String key,String hash,PaymentCreateRequest request){
  User user=actor(userId);Booking b=book(request.bookingId());owner(user,b);
  var claim=idempotency.claim(user,key,"POST /api/payments",hash);
  if(claim.replay())return new Plan(claim.record().getId(),claim.record().getPaymentId(),null,null,true,null);
  live(b);
  Payment active=payments.findByActiveBookingId(b.getId()).orElse(null);
  if(active!=null&&"COMPLIMENTARY".equals(active.getProvider()))return plan(claim,active,idempotency.finish(claim.record(),active,201));
  if(active!=null&&PaymentLedger.captured(active))throw conflict(ErrorCode.PAYMENT_ALREADY_PAID,"Cette réservation est déjà réglée");
  if(active!=null&&(active.getStatus()==PaymentStatus.PROCESSING||active.getIdempotencyKey()!=null))
   throw conflict(ErrorCode.PAYMENT_IN_PROGRESS,"Un paiement est déjà en cours pour cette réservation");
  if(request.method()!=PaymentMethod.CARD&&request.method()!=PaymentMethod.CASH_ON_ARRIVAL)
   throw new BusinessException(ErrorCode.PAYMENT_NOT_ALLOWED,"Méthode attendue : CARD ou CASH_ON_ARRIVAL");
  if(request.method()==PaymentMethod.CARD){
   if(b.getStatus()!=BookingStatus.PENDING||b.getPaymentMethod()!=PaymentMethod.ONLINE)
    throw conflict(ErrorCode.BOOKING_NOT_PAYABLE,"Le paiement carte est réservé aux réservations en ligne en attente");
   if(request.cardToken()==null||request.cardBrand()==null||request.cardLast4()==null)
    throw new BusinessException(ErrorCode.VALIDATION_ERROR,"Le jeton sandbox et les informations masquées de carte sont obligatoires");
  } else {
   if(b.getItems().stream().noneMatch(i->i.getOffer()!=null)
      ||b.getItems().stream().filter(i->i.getOffer()!=null).anyMatch(i->!Boolean.TRUE.equals(i.getOffer().getAllowsPayOnArrival())))
    throw conflict(ErrorCode.CASH_PAYMENT_NOT_ALLOWED,"Une prestation n'autorise pas le paiement à l'arrivée");
   if(request.cardToken()!=null||request.cardBrand()!=null||request.cardLast4()!=null)
    throw new BusinessException(ErrorCode.CARD_DATA_REJECTED,"Aucune information carte n'est attendue pour le paiement à l'arrivée");
  }
  Payment p=active==null?ledger.newAttempt(b):payment(active.getId());
  p.setIdempotencyKey(key);p.setMethod(request.method());p.setAmount(b.getTotal());p.setUpdatedAt(LocalDateTime.now(clock));
  if(request.method()==PaymentMethod.CASH_ON_ARRIVAL){
   b.setPaymentMethod(PaymentMethod.PAY_ON_ARRIVAL);b.setStatus(BookingStatus.CONFIRMED);
   if(b.getConfirmedAt()==null)b.setConfirmedAt(LocalDateTime.now(clock));b.setExpiresAt(null);
   ledger.confirmed(b);
   return plan(claim,p,idempotency.finish(claim.record(),p,201));
  }
  p.setCardBrand(request.cardBrand());p.setCardLast4(request.cardLast4());
  ledger.change(p,PaymentStatus.PROCESSING,"AUTHORIZED",user);return plan(claim,p,null);
 }
 public Settlement finishCharge(Long userId,Plan plan,PaymentGateway.Result result){
  Payment p=lockPaymentAndBooking(plan.paymentId());Booking b=p.getBooking();User user=actor(userId);
  IdempotencyRecord record=records.findById(plan.recordId()).orElseThrow();
  if(p.getStatus()!=PaymentStatus.PROCESSING&&p.getStatus()!=PaymentStatus.CANCELLED)
   return new Settlement(idempotency.finish(record,p,201),false);
  if(result.paid()){
   if(b.getStatus()==BookingStatus.PENDING&&b.getExpiresAt()!=null&&b.getExpiresAt().isBefore(LocalDateTime.now(clock)))bookingService.expire(b.getId());
   p.setPaidAt(LocalDateTime.now(clock));p.setFailureCode(null);p.setFailureMessage(null);
   ledger.change(p,PaymentStatus.PAID,p.getStatus()==PaymentStatus.CANCELLED?"CAPTURED_AFTER_CANCELLATION":"PAID",user);
   if(b.getStatus()==BookingStatus.CANCELLED||b.getStatus()==BookingStatus.EXPIRED
      ||b.getExpiresAt()!=null&&b.getExpiresAt().isBefore(LocalDateTime.now(clock))){
    if(b.getStatus()==BookingStatus.PENDING)bookingService.expire(b.getId());
    ledger.event(p,PaymentStatus.PAID,"REFUND_REQUESTED",null,"{}");return new Settlement(null,true);
   }
   b.setStatus(BookingStatus.CONFIRMED);b.setConfirmedAt(LocalDateTime.now(clock));b.setExpiresAt(null);
   ledger.confirmed(b);
  } else if(p.getStatus()==PaymentStatus.PROCESSING){
   p.setFailureCode(result.failureCode());p.setFailureMessage(result.failureMessage());
   ledger.change(p,PaymentStatus.FAILED,"FAILED",user);
  }
  return new Settlement(idempotency.finish(record,p,201),false);
 }
 public PaymentReply compensate(Plan plan,boolean refunded){
  Payment p=lockPaymentAndBooking(plan.paymentId());
  if(refunded){p.setRefundedAmount(p.getAmount());p.setRefundedAt(LocalDateTime.now(clock));ledger.change(p,PaymentStatus.REFUNDED,"REFUNDED",null);bookingService.cancelAfterRefund(p.getBooking(),null,"Paiement reçu après annulation ou expiration");}
  else{p.setFailureCode("REFUND_PENDING");p.setFailureMessage("Un remboursement doit être vérifié par l'administrateur");}
  return idempotency.finish(records.findById(plan.recordId()).orElseThrow(),p,201);
 }
 public Plan prepareRefund(Long userId,Long paymentId,String key,String hash,PaymentRefundRequest request){
  User user=actor(userId);if(user.getRole()!=Role.ADMIN)throw new ForbiddenException("Remboursement réservé aux administrateurs");
  Payment p=lockPaymentAndBooking(paymentId);
  var claim=idempotency.claim(user,key,"POST /api/payments/"+paymentId+"/refund",hash);
  if(claim.replay())return new Plan(claim.record().getId(),paymentId,null,null,true,null);
  if(!PaymentLedger.captured(p))throw conflict(ErrorCode.PAYMENT_NOT_ALLOWED,"Seul un paiement reçu peut être remboursé");
  BigDecimal available=p.getAmount().subtract(p.getRefundedAmount()).subtract(p.getReservedRefundAmount());
  BigDecimal amount=request.amount()==null?available:request.amount().setScale(2,RoundingMode.HALF_UP);
  if(amount.signum()<=0)throw new BusinessException(ErrorCode.INVALID_AMOUNT,"Le montant doit être strictement positif");
  if(amount.compareTo(available)>0)throw conflict(ErrorCode.REFUND_EXCEEDS_PAID,"Le remboursement dépasse le montant encore remboursable");
  p.setReservedRefundAmount(p.getReservedRefundAmount().add(amount));p.setUpdatedAt(LocalDateTime.now(clock));claim.record().setOperationAmount(amount);
  ledger.event(p,p.getStatus(),"REFUND_REQUESTED",user,details(request.reason(),amount));
  audit.log(user,"PAYMENT_REFUND_REQUESTED",p.getId(),null,details(request.reason(),amount));
  return new Plan(claim.record().getId(),p.getId(),p.getProviderReference(),amount,false,null);
 }
 public PaymentReply finishRefund(Long userId,Plan plan,PaymentRefundRequest request,boolean success){
  User user=actor(userId);Payment p=lockPaymentAndBooking(plan.paymentId());
  p.setReservedRefundAmount(p.getReservedRefundAmount().subtract(plan.amount()));p.setUpdatedAt(LocalDateTime.now(clock));
  IdempotencyRecord record=records.findById(plan.recordId()).orElseThrow();
  if(!success){
   record.setResponseStatus(502);record.setResponseBody("{}");
   ledger.event(p,p.getStatus(),"REFUND_FAILED",user,"{}");return null;
  }
  p.setRefundedAmount(p.getRefundedAmount().add(plan.amount()));p.setRefundedAt(LocalDateTime.now(clock));
  boolean full=p.getRefundedAmount().compareTo(p.getAmount())==0;
  ledger.change(p,full?PaymentStatus.REFUNDED:PaymentStatus.PARTIALLY_REFUNDED,"REFUNDED",user,details(request.reason(),plan.amount()));
  audit.log(user,"PAYMENT_REFUNDED",p.getId(),null,details(request.reason(),plan.amount()));
  if(full)bookingService.cancelAfterRefund(p.getBooking(),user,request.reason());
  return idempotency.finish(record,p,200);
 }
 public PaymentReply collect(Long userId,Long id,String key,String hash,CashCollectionRequest request){
  User user=actor(userId);
  if(user.getRole()!=Role.AGENT&&user.getRole()!=Role.ADMIN)throw new ForbiddenException("Encaissement réservé aux agents et administrateurs");
  Payment p=lockPaymentAndBooking(id);var claim=idempotency.claim(user,key,"POST /api/payments/"+id+"/collect-cash",hash);
  if(claim.replay())return null;
  if(PaymentLedger.captured(p))throw conflict(ErrorCode.PAYMENT_ALREADY_PAID,"Ce paiement a déjà été encaissé");
  if(p.getMethod()!=PaymentMethod.CASH_ON_ARRIVAL||p.getStatus()!=PaymentStatus.PENDING||p.getBooking().getStatus()!=BookingStatus.CONFIRMED)
   throw conflict(ErrorCode.CASH_PAYMENT_NOT_ALLOWED,"Ce paiement ne peut pas être encaissé à l'arrivée");
  if(request.amount().compareTo(p.getAmount())!=0)throw new BusinessException(ErrorCode.INVALID_AMOUNT,"Le montant doit correspondre exactement au solde dû");
  p.setCollectedBy(user);p.setPaidAt(LocalDateTime.now(clock));ledger.change(p,PaymentStatus.PAID,"CASH_COLLECTED",user,details(request.note(),p.getAmount()));
  audit.log(user,"CASH_COLLECTED",p.getId(),null,details(request.note(),p.getAmount()));
  return idempotency.finish(claim.record(),p,200);
 }
}

