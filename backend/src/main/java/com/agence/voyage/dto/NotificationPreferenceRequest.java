package com.agence.voyage.dto;
import jakarta.validation.constraints.NotNull;
public record NotificationPreferenceRequest(@NotNull Boolean emailEnabled,@NotNull Boolean inAppEnabled,
 @NotNull Boolean bookingEmail,@NotNull Boolean paymentEmail,@NotNull Boolean offerEmail,@NotNull Boolean supportEmail) {}
