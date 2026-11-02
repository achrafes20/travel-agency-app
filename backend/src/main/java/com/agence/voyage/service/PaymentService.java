package com.agence.voyage.service;

import com.agence.voyage.dto.*;
import com.agence.voyage.exception.*;
import org.springframework.dao.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.util.function.Supplier;

/** Orchestration sans transaction : le gateway est appelé après libération des verrous. */
@Service
public class PaymentService {
 private final PaymentTransactions transactions;private final PaymentIdempotency idempotency;private final PaymentGateway gateway;
 private final PaymentRateLimiter rateLimiter;
 public PaymentService(PaymentTransactions transactions,PaymentIdempotency idempotency,PaymentGateway gateway,PaymentRateLimiter rateLimiter){
  this.transactions=transactions;this.idempotency=idempotency;this.gateway=gateway;this.rateLimiter=rateLimiter;
 }
 private void outsideTransaction(){
  if(TransactionSynchronizationManager.isActualTransactionActive())throw new IllegalStateException("L'orchestrateur de paiement doit être appelé hors transaction");
 }
 private <T>T retry(Supplier<T> operation){
  for(int attempt=0;;attempt++)try{return operation.get();}
  catch(ConcurrencyFailureException|DataIntegrityViolationException e){if(attempt>=3)throw e;}
 }
 private PaymentReply await(Long userId,String key,String endpoint,String hash){
  for(int attempt=0;attempt<250;attempt++){
   PaymentReply reply=idempotency.replay(userId,key,endpoint,hash);if(reply!=null)return reply;
   try{Thread.sleep(20);}catch(InterruptedException e){Thread.currentThread().interrupt();break;}
  }
  throw new BusinessException(ErrorCode.PAYMENT_IN_PROGRESS,HttpStatus.CONFLICT,"Cette demande est encore en cours. Réessayez avec la même clé.");
 }
 public PaymentReply initiate(Long userId,String key,PaymentCreateRequest request,String requestHash){
  outsideTransaction();PaymentIdempotency.validateKey(key);rateLimiter.check(userId);
  String hash=requestHash==null?idempotency.hash(request):requestHash;
  var plan=retry(()->transactions.prepare(userId,key,hash,request));
  if(plan.replay())return await(userId,key,"POST /api/payments",hash);
  if(plan.immediate()!=null)return plan.immediate();
  PaymentGateway.Result outcome;
  try{outcome=gateway.charge(new PaymentGateway.Charge(plan.reference(),plan.amount(),"MAD",request.cardToken(),"charge:"+plan.paymentId()));}
  catch(RuntimeException e){outcome=new PaymentGateway.Result(false,plan.reference(),"GATEWAY_UNAVAILABLE","Le simulateur est temporairement indisponible. Vous pouvez réessayer.");}
  var result=transactions.finishCharge(userId,plan,outcome);
  if(!result.compensate())return result.reply();
  boolean refunded=true;
  try{gateway.refund(plan.reference(),plan.amount(),"compensation:"+plan.paymentId());}catch(RuntimeException e){refunded=false;}
  return transactions.compensate(plan,refunded);
 }
 public PaymentReply refund(Long userId,Long paymentId,String key,PaymentRefundRequest request,String requestHash){
  outsideTransaction();PaymentIdempotency.validateKey(key);
  String hash=requestHash==null?idempotency.hash(request):requestHash;
  var plan=retry(()->transactions.prepareRefund(userId,paymentId,key,hash,request));
  if(plan.replay())return await(userId,key,"POST /api/payments/"+paymentId+"/refund",hash);
  boolean success=true;
  try{gateway.refund(plan.reference(),plan.amount(),"refund:"+plan.recordId());}catch(RuntimeException e){success=false;}
  var result=transactions.finishRefund(userId,plan,request,success);
  if(!success)throw new BusinessException(ErrorCode.PAYMENT_FAILED,HttpStatus.BAD_GATEWAY,"Le remboursement n'a pas abouti. Réessayez avec une nouvelle demande.");
  return result;
 }
 public PaymentReply collect(Long userId,Long id,String key,CashCollectionRequest request,String requestHash){
  outsideTransaction();PaymentIdempotency.validateKey(key);
  String hash=requestHash==null?idempotency.hash(request):requestHash;
  PaymentReply result=retry(()->transactions.collect(userId,id,key,hash,request));
  return result==null?await(userId,key,"POST /api/payments/"+id+"/collect-cash",hash):result;
 }
}

