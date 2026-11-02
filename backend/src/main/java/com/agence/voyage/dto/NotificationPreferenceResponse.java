package com.agence.voyage.dto;
import com.agence.voyage.entity.NotificationPreference;
public record NotificationPreferenceResponse(boolean emailEnabled,boolean inAppEnabled,boolean bookingEmail,
 boolean paymentEmail,boolean offerEmail,boolean supportEmail) {
 public static NotificationPreferenceResponse from(NotificationPreference p){return new NotificationPreferenceResponse(
 p.isEmailEnabled(),p.isInAppEnabled(),p.isBookingEmail(),p.isPaymentEmail(),p.isOfferEmail(),p.isSupportEmail());}
}
