package com.agence.voyage.domain;

import com.agence.voyage.config.BookingProperties;
import com.agence.voyage.exception.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import java.math.BigDecimal;
import java.time.*;
import static org.junit.jupiter.api.Assertions.*;

class CancellationPolicyTest {
    private final Instant now = Instant.parse("2026-10-30T10:00:00Z");
    private final CancellationPolicy policy = new CancellationPolicy(
            new BookingProperties.Cancellation(48, 24, 50), Clock.fixed(now, ZoneOffset.UTC));

    @ParameterizedTest
    @CsvSource({"60,100,1000.00,true", "48,100,1000.00,true", "36,50,500.00,false",
            "24,50,500.00,false", "10,0,0.00,false"})
    void evaluatesBoundaries(int hours, int percent, String refund, boolean free) {
        var result = policy.evaluate(now.plus(Duration.ofHours(hours)), new BigDecimal("1000"));
        assertEquals(percent, result.refundPercent());
        assertEquals(new BigDecimal(refund), result.refundAmount());
        assertEquals(free, result.freeCancellation());
    }
    @Test void noRoundingAcrossBoundary() {
        assertEquals(50, policy.evaluate(now.plus(Duration.ofHours(48)).minusSeconds(1), BigDecimal.TEN).refundPercent());
        assertEquals(0, policy.evaluate(now.plus(Duration.ofHours(24)).minusSeconds(1), BigDecimal.TEN).refundPercent());
    }
    @Test void rejectsStartedService() {
        for (Instant start : new Instant[]{now, now.minusSeconds(1)}) {
            assertEquals(ErrorCode.BOOKING_NOT_CANCELLABLE,
                    assertThrows(BusinessException.class, () -> policy.evaluate(start, BigDecimal.TEN)).getCode());
        }
    }
    @Test void arrivalUnpaidHasZeroRefundAndRoundingIsMonetary() {
        assertEquals(new BigDecimal("0.00"), policy.evaluate(now.plus(Duration.ofHours(36)), BigDecimal.ZERO).refundAmount());
        assertEquals(new BigDecimal("5.01"), policy.evaluate(now.plus(Duration.ofHours(36)), new BigDecimal("10.01")).refundAmount());
    }
    @Test void respectsCustomThresholds() {
        var custom = new CancellationPolicy(new BookingProperties.Cancellation(72, 12, 25), Clock.fixed(now, ZoneOffset.UTC));
        assertEquals(25, custom.evaluate(now.plus(Duration.ofHours(60)), BigDecimal.TEN).refundPercent());
    }
}
