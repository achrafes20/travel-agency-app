package com.agence.voyage.service;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.concurrent.ConcurrentHashMap;

/** Simulation explicite. Ne contacte aucun prestataire et ne manipule aucune carte. */
@Component
public class SandboxPaymentGateway implements PaymentGateway {
 private final ConcurrentHashMap<String,Result> charges=new ConcurrentHashMap<>();
 private final ConcurrentHashMap<String,BigDecimal> refunds=new ConcurrentHashMap<>();
 @Override public Result charge(Charge request) {
  return charges.computeIfAbsent(request.idempotencyKey(),key->switch(request.token()){
   case "tok_sandbox_success" -> new Result(true,request.reference(),null,null);
   case "tok_sandbox_declined" -> new Result(false,request.reference(),"CARD_DECLINED","La carte de test a été refusée.");
   case "tok_sandbox_insufficient_funds" -> new Result(false,request.reference(),"INSUFFICIENT_FUNDS","Le solde de la carte de test est insuffisant.");
   default -> new Result(false,request.reference(),"GATEWAY_UNAVAILABLE","Le simulateur est temporairement indisponible. Vous pouvez réessayer.");
  });
 }
 @Override public void refund(String reference,BigDecimal amount,String key) {
  refunds.putIfAbsent(key,amount);
 }
}

