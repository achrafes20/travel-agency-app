package com.agence.voyage.domain;

import com.agence.voyage.entity.PaymentStatus;
import com.agence.voyage.exception.*;
import java.util.*;

public final class PaymentStateMachine {
    private static final Map<PaymentStatus, Set<PaymentStatus>> ALLOWED = Map.of(
            PaymentStatus.PENDING, Set.of(PaymentStatus.PAID, PaymentStatus.FAILED),
            PaymentStatus.PAID, Set.of(PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED),
            PaymentStatus.PARTIALLY_REFUNDED, Set.of(PaymentStatus.REFUNDED));
    public PaymentStatus transition(PaymentStatus from, PaymentStatus to) {
        if (from == null || to == null || !ALLOWED.getOrDefault(from, Set.of()).contains(to)) {
            throw new BusinessException(ErrorCode.INVALID_STATE_TRANSITION, "Transition de paiement interdite");
        }
        return to;
    }
}
