package com.agence.voyage.domain;

import com.agence.voyage.entity.*;
import com.agence.voyage.exception.*;
import org.junit.jupiter.api.Test;
import java.util.Set;
import static org.junit.jupiter.api.Assertions.*;

class StateMachineTest {
    @Test void bookingAllPairs() {
        var machine = new BookingStateMachine();
        Set<String> allowed = Set.of("PENDING:CONFIRMED", "PENDING:CANCELLED", "PENDING:EXPIRED",
                "CONFIRMED:COMPLETED", "CONFIRMED:CANCELLED");
        for (var from : BookingStatus.values()) for (var to : BookingStatus.values()) {
            if (allowed.contains(from + ":" + to)) assertEquals(to, machine.transition(from, to));
            else assertEquals(ErrorCode.INVALID_STATE_TRANSITION,
                    assertThrows(BusinessException.class, () -> machine.transition(from, to)).getCode());
        }
    }
    @Test void paymentAllPairs() {
        var machine = new PaymentStateMachine();
        Set<String> allowed = Set.of("PENDING:PAID", "PENDING:FAILED", "PAID:REFUNDED",
                "PAID:PARTIALLY_REFUNDED", "PARTIALLY_REFUNDED:REFUNDED");
        for (var from : PaymentStatus.values()) for (var to : PaymentStatus.values()) {
            if (allowed.contains(from + ":" + to)) assertEquals(to, machine.transition(from, to));
            else assertEquals(ErrorCode.INVALID_STATE_TRANSITION,
                    assertThrows(BusinessException.class, () -> machine.transition(from, to)).getCode());
        }
    }
}
