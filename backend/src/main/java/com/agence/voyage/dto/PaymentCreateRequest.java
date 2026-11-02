package com.agence.voyage.dto;
import com.agence.voyage.entity.PaymentMethod;
import jakarta.validation.constraints.*;
public record PaymentCreateRequest(@NotNull @Positive Long bookingId,@NotNull PaymentMethod method,
 @Pattern(regexp="tok_sandbox_(success|declined|insufficient_funds|error)",message="Jeton sandbox invalide") String cardToken,
 @Pattern(regexp="[0-9]{4}",message="Quatre derniers chiffres requis") String cardLast4,
 @Pattern(regexp="VISA|MASTERCARD|AMEX",message="Marque de carte invalide") String cardBrand) {}

