package com.agence.voyage.event;
public record BookingConfirmedEvent(String eventId,BookingNotice booking) {}
