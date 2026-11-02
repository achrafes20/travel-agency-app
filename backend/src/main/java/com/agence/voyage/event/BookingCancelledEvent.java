package com.agence.voyage.event;
public record BookingCancelledEvent(String eventId,BookingNotice booking,String reason,String cancelledBy) {}
