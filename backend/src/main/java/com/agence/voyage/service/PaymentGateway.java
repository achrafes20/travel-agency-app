package com.agence.voyage.service;
import java.math.BigDecimal;
/** Adaptateur externe : aucune transaction JPA ni donnée carte sensible dans ce contrat. */
public interface PaymentGateway {
 record Charge(String reference,BigDecimal amount,String currency,String token,String idempotencyKey) {}
 record Result(boolean paid,String reference,String failureCode,String failureMessage) {}
 Result charge(Charge request);
 void refund(String reference,BigDecimal amount,String idempotencyKey);
}

