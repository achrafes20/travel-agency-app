package com.agence.voyage.dto.stats;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
/** Projections scalaires uniquement ; aucun objet JPA ne quitte le service. */
public final class StatsDtos {
 private StatsDtos(){}
 public record Kpi(BigDecimal value,BigDecimal previous,BigDecimal changePercent){}
 public record Point(String key,String label,long bookings,BigDecimal revenue){}
 public record UserStats(Kpi total,Kpi newUsers,Map<String,Long> byRole,long active,long archived,long estimatedCreationDates){}
 public record BookingStats(Kpi total,Map<String,Long> byStatus,List<Point> series){}
 public record RevenueStats(Kpi total,Kpi pendingRevenue,Kpi averageOrder,List<Point> series){}
 public record Destination(Long cityId,String name,long bookings,BigDecimal revenue){}
 public record TopOffer(Long id,String title,String type,String city,long bookings,BigDecimal revenue){}
 public record PromoWatch(Long id,String code,String reason,long uses,LocalDate expiryDate,boolean active){}
 public record Alert(String code,String message,long count,String link){}
 public record OfferCounts(long total,long active,long inactive){}
 public record AvailabilityCheck(Long offerId,String title,String city,boolean noFuturePeriod,boolean lowCapacity,boolean endingSoon,LocalDateTime lastEndAt){}
 public record AvailabilityStats(long count,List<AvailabilityCheck> items){}
 public record RecentBooking(Long id,String reference,String status,String paymentStatus,String clientName,BigDecimal total,
  String currency,LocalDateTime createdAt,LocalDateTime serviceStartAt,LocalDateTime serviceEndAt){}
 public record CashPayment(Long id,Long bookingId,String reference,String clientName,BigDecimal amount,LocalDateTime serviceStartAt){}
 public record Activity(Long id,String type,String title,String message,LocalDateTime createdAt,String link){}
 public record TicketStats(boolean available,long count,List<String> items){}
 public record UnreadNotifications(boolean available,long count,List<Activity> items){}
 public record ClientTotals(long bookings,BigDecimal spent){}
 public record Admin(String period,LocalDate from,LocalDate to,OffsetDateTime generatedAt,String timezone,String currency,
  UserStats users,BookingStats bookings,RevenueStats revenue,List<Destination> topDestinations,List<TopOffer> topOffers,
  List<PromoWatch> promoCodes,List<Alert> alerts){}
 public record Supplier(String period,LocalDate from,LocalDate to,OffsetDateTime generatedAt,String timezone,String currency,
  String fullName,OfferCounts offers,Kpi bookings,Kpi bookingsThisMonth,Kpi revenue,List<Point> revenueSixMonths,
  AvailabilityStats availabilityChecks,List<RecentBooking> recentBookings,List<Activity> recentActivity){}
 public record Agent(String period,LocalDate from,LocalDate to,OffsetDateTime generatedAt,String timezone,String currency,
  Kpi pendingBookings,long cashPendingCount,BigDecimal cashPendingAmount,TicketStats tickets,Kpi bookingsToday,
  List<RecentBooking> recentBookings,List<CashPayment> upcomingPayments){}
 public record Client(String period,LocalDate from,LocalDate to,OffsetDateTime generatedAt,String timezone,String currency,
  String fullName,RecentBooking nextTrip,List<RecentBooking> recentBookings,UnreadNotifications notifications,
  ClientTotals totals,Kpi bookingsInPeriod,Kpi spentInPeriod){}
}
