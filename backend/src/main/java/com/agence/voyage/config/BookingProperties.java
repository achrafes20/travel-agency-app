package com.agence.voyage.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

@Validated
public record BookingProperties(
        @Valid @DefaultValue Cancellation cancellation,
        @DefaultValue("30") @Positive int paymentExpirationMinutes) {
    public record Cancellation(
            @DefaultValue("48") @Positive int freeHours,
            @DefaultValue("24") @Positive int partialHours,
            @DefaultValue("50") @Min(0) @Max(100) int partialRefundPercent) {
        @AssertTrue(message = "free-hours doit être supérieur à partial-hours")
        public boolean isThresholdOrderValid() { return freeHours > partialHours; }
    }
}
