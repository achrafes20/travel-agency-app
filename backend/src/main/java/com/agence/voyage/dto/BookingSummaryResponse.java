package com.agence.voyage.dto;
import com.agence.voyage.entity.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
public record BookingSummaryResponse(Long id,String reference,String clientName,String clientEmail,
 BookingStatus status,PaymentStatus paymentStatus,PaymentMethod paymentMethod,BigDecimal total,String currency,
 LocalDateTime createdAt,LocalDateTime serviceStartAt,LocalDateTime serviceEndAt,boolean canCancel,boolean voucherAvailable,boolean canPay) {}

