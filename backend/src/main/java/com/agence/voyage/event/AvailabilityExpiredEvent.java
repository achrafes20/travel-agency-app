package com.agence.voyage.event;
import java.time.LocalDateTime;
public record AvailabilityExpiredEvent(String eventId,Long availabilityId,Long offerId,Long supplierId,
 String title,LocalDateTime endAt,boolean expired) {}
