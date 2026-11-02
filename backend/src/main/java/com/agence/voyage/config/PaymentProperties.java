package com.agence.voyage.config;
import jakarta.validation.constraints.*;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix="payment")
public record PaymentProperties(
 @DefaultValue("sandbox") @NotBlank String provider,
 String webhookSecret,
 @DefaultValue("300") @Min(1) long webhookToleranceSeconds,
 @DefaultValue("24") @Min(1) long idempotencyTtlHours,
 @DefaultValue("60") @Min(1) int requestsPerMinute) {}

