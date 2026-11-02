package com.agence.voyage.config;
import jakarta.validation.constraints.*;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix="booking")
public record BookingModuleProperties(
 @DefaultValue("30") @Min(1) int pendingExpirationMinutes,
 @DefaultValue("48") @Min(0) int cancellationDeadlineHours,
 @jakarta.validation.Valid @DefaultValue Voucher voucher,
 @jakarta.validation.Valid @DefaultValue Jobs jobs) {
 public record Voucher(@NotBlank @Size(min=16) String secret) {}
 public record Jobs(@DefaultValue("100") @Min(1) @Max(1000) int batchSize) {}
}

