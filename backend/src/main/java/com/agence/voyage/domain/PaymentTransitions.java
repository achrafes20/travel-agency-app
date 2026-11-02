package com.agence.voyage.domain;
import com.agence.voyage.entity.PaymentStatus;
import com.agence.voyage.exception.*;
import java.util.*;
/** Transitions opérationnelles Phase 3 ; la politique pure Phase 1 reste rétrocompatible. */
public final class PaymentTransitions {
 private PaymentTransitions(){}
 private static final Map<PaymentStatus,Set<PaymentStatus>> ALLOWED=Map.of(
  PaymentStatus.PENDING,Set.of(PaymentStatus.PROCESSING,PaymentStatus.PAID,PaymentStatus.FAILED,PaymentStatus.CANCELLED),
  PaymentStatus.PROCESSING,Set.of(PaymentStatus.PAID,PaymentStatus.FAILED,PaymentStatus.CANCELLED),
  PaymentStatus.PAID,Set.of(PaymentStatus.PARTIALLY_REFUNDED,PaymentStatus.REFUNDED),
  PaymentStatus.PARTIALLY_REFUNDED,Set.of(PaymentStatus.PARTIALLY_REFUNDED,PaymentStatus.REFUNDED));
 public static void check(PaymentStatus from,PaymentStatus to,String event){
  if(from==PaymentStatus.CANCELLED&&to==PaymentStatus.PAID&&"CAPTURED_AFTER_CANCELLATION".equals(event))return;
  if(from==null||to==null||!ALLOWED.getOrDefault(from,Set.of()).contains(to))
   throw new BusinessException(ErrorCode.INVALID_STATE_TRANSITION,"Transition de paiement interdite");
 }
}

