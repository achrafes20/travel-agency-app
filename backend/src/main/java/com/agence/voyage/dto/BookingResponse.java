package com.agence.voyage.dto;
import com.agence.voyage.entity.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
public record BookingResponse(Long id, String reference, BookingStatus status, PaymentStatus paymentStatus,
 PaymentMethod paymentMethod, String clientName, String clientEmail, BigDecimal subtotal, BigDecimal discount,
 BigDecimal total, String currency, String promoCode, DiscountType promoType, BigDecimal promoValue,
 LocalDateTime createdAt, LocalDateTime confirmedAt, LocalDateTime cancelledAt, String cancellationReason,
 Long cancelledBy, LocalDateTime expiresAt, LocalDateTime serviceStartAt, LocalDateTime serviceEndAt,
 boolean canCancel, boolean voucherAvailable, boolean supplierView, List<BookingItemResponse> items,boolean payOnArrivalAllowed) {}

