package com.agence.voyage.service;
import com.agence.voyage.config.PaymentProperties;
import com.agence.voyage.dto.*;
import com.agence.voyage.entity.*;
import com.agence.voyage.exception.*;
import com.agence.voyage.repository.IdempotencyRecordRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import org.springframework.http.HttpStatus;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.HexFormat;

@Service
public class PaymentIdempotency {
 private final IdempotencyRecordRepository repository;private final ObjectMapper mapper;
 private final PaymentProperties properties;private final Clock clock;
 @jakarta.persistence.PersistenceContext private jakarta.persistence.EntityManager em;
 public PaymentIdempotency(IdempotencyRecordRepository repository,ObjectMapper mapper,PaymentProperties properties,Clock clock){this.repository=repository;this.mapper=mapper;this.properties=properties;this.clock=clock;}
 public static void validateKey(String key){
  if(key!=null&&PaymentDataGuard.luhn(key))throw new BusinessException(ErrorCode.CARD_DATA_REJECTED,"Un numéro de carte ne peut pas être utilisé comme clé");
  if(key==null||!key.matches("[A-Za-z0-9_-]{16,64}"))throw new BusinessException(ErrorCode.IDEMPOTENCY_KEY_REQUIRED,"L'en-tête Idempotency-Key doit contenir de 16 à 64 caractères alphanumériques, tirets ou soulignés");
 }
 public static String sha256(String value){
  try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}
  catch(NoSuchAlgorithmException e){throw new IllegalStateException("SHA-256 indisponible",e);}
 }
 public String hash(Object body){try{return sha256(mapper.writeValueAsString(body));}catch(Exception e){throw new IllegalStateException("Empreinte impossible",e);}}
 public record Claim(IdempotencyRecord record,boolean replay){}
 @Transactional(propagation=Propagation.MANDATORY)
 public Claim claim(User user,String key,String endpoint,String hash){
  validateKey(key);
  var found=repository.findByUserIdAndKey(user.getId(),key);
  if(found.isPresent()&&found.get().getExpiresAt().isBefore(LocalDateTime.now(clock))){repository.delete(found.get());repository.flush();found=java.util.Optional.empty();}
  if(found.isPresent()){
   IdempotencyRecord row=found.get();
   if(!endpoint.equals(row.getEndpoint())||!hash.equals(row.getRequestHash()))
    throw new BusinessException(ErrorCode.IDEMPOTENCY_KEY_REUSED,HttpStatus.UNPROCESSABLE_ENTITY,"Cette clé d'idempotence a déjà été utilisée pour une autre demande");
   return new Claim(row,true);
  }
  IdempotencyRecord row=new IdempotencyRecord();row.setUser(user);row.setKey(key);row.setEndpoint(endpoint);row.setRequestHash(hash);
  row.setCreatedAt(LocalDateTime.now(clock));row.setExpiresAt(row.getCreatedAt().plusHours(properties.idempotencyTtlHours()));
  return new Claim(repository.saveAndFlush(row),false);
 }
 @Transactional(propagation=Propagation.MANDATORY)
 public PaymentReply finish(IdempotencyRecord row,Payment payment,int status){
  try{
   PaymentResponse response=PaymentResponse.from(payment);
   row.setPaymentId(payment.getId());row.setResponseStatus(status);row.setResponseBody(mapper.writeValueAsString(response));
   return new PaymentReply(status,response);
  }catch(Exception e){throw new IllegalStateException("Réponse idempotente impossible",e);}
 }
 @Transactional(readOnly=true)
 public PaymentReply replay(Long userId,String key,String endpoint,String hash){
  var found=repository.readResponse(userId,key);if(found.isEmpty())return null;
  var row=found.get();
  // OSIV conserve le contexte JPA pendant les requêtes HTTP concurrentes :
  // rafraîchir la réponse du premier appel au lieu de réutiliser sa copie PROCESSING.
  em.refresh(row);
  if(!endpoint.equals(row.getEndpoint())||!hash.equals(row.getRequestHash()))throw new BusinessException(ErrorCode.IDEMPOTENCY_KEY_REUSED,HttpStatus.UNPROCESSABLE_ENTITY,"Cette clé d'idempotence correspond à une autre demande");
  if(row.getResponseBody()==null)return null;
  if(row.getResponseStatus()!=null&&row.getResponseStatus()>=400)
   throw new BusinessException(ErrorCode.PAYMENT_FAILED,HttpStatus.valueOf(row.getResponseStatus()),"Le remboursement n'a pas abouti. Réessayez avec une nouvelle demande.");
  try{return new PaymentReply(200,mapper.readValue(row.getResponseBody(),PaymentResponse.class));}
  catch(Exception e){throw new IllegalStateException("Relecture idempotente impossible",e);}
 }
}

