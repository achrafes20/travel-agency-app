package com.agence.voyage.domain;

import com.agence.voyage.config.BookingProperties;
import com.agence.voyage.exception.*;
import java.math.*;
import java.time.*;

/** Politique pure : aucune écriture, aucun appel à un prestataire de paiement. */
public final class CancellationPolicy {
    private final BookingProperties.Cancellation rules;
    private final Clock clock;
    public CancellationPolicy(BookingProperties.Cancellation rules, Clock clock) {
        this.rules = rules;
        this.clock = clock;
    }
    public record Decision(int refundPercent, BigDecimal refundAmount, boolean freeCancellation) {}
    public Decision evaluate(Instant serviceStart, BigDecimal paidAmount) {
        if (serviceStart == null || paidAmount == null || paidAmount.signum() < 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Début du service et montant payé positif requis");
        }
        Duration remaining = Duration.between(clock.instant(), serviceStart);
        if (remaining.isNegative() || remaining.isZero()) {
            throw new BusinessException(ErrorCode.BOOKING_NOT_CANCELLABLE, "Le service a déjà commencé");
        }
        boolean free = remaining.compareTo(Duration.ofHours(rules.freeHours())) >= 0;
        int percent = free ? 100 : remaining.compareTo(Duration.ofHours(rules.partialHours())) >= 0
                ? rules.partialRefundPercent() : 0;
        BigDecimal refund = paidAmount.multiply(BigDecimal.valueOf(percent))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        return new Decision(percent, refund, free);
    }
}
