package com.agence.voyage.event;
public record PaymentFailedEvent(String eventId,Long paymentId,BookingNotice booking,String failureMessage) {}
