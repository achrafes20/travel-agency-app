package com.agence.voyage.dto;
import java.math.BigDecimal;
import jakarta.validation.constraints.*;
public record PaymentRefundRequest(@DecimalMin("0.01") @Digits(integer=10,fraction=2) BigDecimal amount,
 @NotBlank @Size(max=1000) String reason) {}

