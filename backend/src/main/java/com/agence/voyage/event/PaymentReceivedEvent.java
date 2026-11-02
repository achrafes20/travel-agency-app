package com.agence.voyage.event;
import java.math.BigDecimal;
import java.time.LocalDateTime;
public record PaymentReceivedEvent(String eventId,Long paymentId,BookingNotice booking,BigDecimal amount,
 String method,LocalDateTime paidAt) {}
