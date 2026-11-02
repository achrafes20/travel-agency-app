package com.agence.voyage.dto;
import com.agence.voyage.entity.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
public record PaymentResponse(Long id,Long bookingId,String bookingReference,BookingStatus bookingStatus,
 String clientName,String clientEmail,PaymentMethod method,PaymentStatus status,BigDecimal amount,
 BigDecimal refundedAmount,BigDecimal refundableAmount,String currency,String provider,String providerReference,
 String cardBrand,String cardLast4,String failureCode,String failureMessage,Long collectedBy,String collectedByName,
 LocalDateTime createdAt,LocalDateTime updatedAt,LocalDateTime paidAt,LocalDateTime refundedAt,
 LocalDateTime serviceStartAt,LocalDateTime expiresAt,boolean sandbox,boolean demonstration) {
 public static PaymentResponse from(Payment p){
  return new PaymentResponse(p.getId(),p.getBooking().getId(),p.getBooking().getReference(),p.getBooking().getStatus(),
   p.getClient().getFullName(),p.getClient().getEmail(),p.getMethod(),p.getStatus(),p.getAmount(),p.getRefundedAmount(),
   p.getAmount().subtract(p.getRefundedAmount()).subtract(p.getReservedRefundAmount()),p.getCurrency(),p.getProvider(),
   p.getProviderReference(),p.getCardBrand(),p.getCardLast4(),p.getFailureCode(),p.getFailureMessage(),
   p.getCollectedBy()==null?null:p.getCollectedBy().getId(),p.getCollectedBy()==null?null:p.getCollectedBy().getFullName(),
   p.getCreatedAt(),p.getUpdatedAt(),p.getPaidAt(),p.getRefundedAt(),p.getBooking().getServiceStartAt(),
   p.getBooking().getExpiresAt(),"SANDBOX".equals(p.getProvider()),p.getBooking().getNotes()!=null&&p.getBooking().getNotes().startsWith("demo:"));
 }
}

