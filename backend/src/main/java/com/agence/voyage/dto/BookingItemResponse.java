package com.agence.voyage.dto;
import java.math.BigDecimal;
import java.time.LocalDateTime;
public record BookingItemResponse(Long id, Long parentItemId, Long offerId, Long bundleId, Long supplierId,
 String title, int quantity, BigDecimal unitPrice, BigDecimal lineTotal, String travelCriteria,
 LocalDateTime serviceStartAt, LocalDateTime serviceEndAt) {}

