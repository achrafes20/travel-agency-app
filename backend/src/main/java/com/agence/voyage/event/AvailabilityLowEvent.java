package com.agence.voyage.event;
public record AvailabilityLowEvent(String eventId,Long availabilityId,Long offerId,Long supplierId,String title,
 int remaining,int initialCapacity) {}
