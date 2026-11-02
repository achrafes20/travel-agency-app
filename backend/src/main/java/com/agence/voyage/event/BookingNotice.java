package com.agence.voyage.event;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
public record BookingNotice(Long bookingId,Long clientId,String reference,BigDecimal total,
 LocalDateTime startAt,LocalDateTime endAt,List<Line> lines) {
 public BookingNotice{lines=List.copyOf(lines);}
 public record Line(Long supplierId,String title,int quantity,BigDecimal total,LocalDateTime startAt,LocalDateTime endAt){}
}
