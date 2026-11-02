package com.agence.voyage.service;
import com.agence.voyage.config.NotificationProperties;
import com.agence.voyage.entity.*;
import com.agence.voyage.event.*;
import com.agence.voyage.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import java.time.*;
@Service
public class AvailabilityAlertService {
 private final OfferAvailabilityRepository periods;private final BookingAllocationRepository allocations;
 private final NotificationEvents events;private final NotificationProperties properties;private final Clock clock;
 public AvailabilityAlertService(OfferAvailabilityRepository periods,BookingAllocationRepository allocations,
 NotificationEvents events,NotificationProperties properties,Clock clock){this.periods=periods;this.allocations=allocations;this.events=events;this.properties=properties;this.clock=clock;}
 public boolean isLow(int remaining,long initial){
  return remaining<=properties.lowCapacityUnits() || initial>0 && remaining*100L<=initial*properties.lowCapacityPercent();
 }
 @Transactional(readOnly=true)
 public int scan(){
  LocalDateTime now=LocalDateTime.now(clock);int count=0,page=0;
  java.util.List<Object[]> batch;
  do {
   batch=periods.alertCandidates(PageRequest.of(page++,100));
   for(var row:batch){
    Offer offer=(Offer)row[0];OfferAvailability period=(OfferAvailability)row[1];
    long total=period.getCapacity()+allocations.consumed(period.getId());
    if(!period.getEndAt().isBefore(now)&&isLow(period.getCapacity(),total)){
     String tier=period.getCapacity()<=properties.lowCapacityUnits()?"CRITICAL":"LOW";
     events.publish(new AvailabilityLowEvent("availability:low:"+period.getId()+":"+tier,period.getId(),offer.getId(),
      offer.getSupplier().getId(),offer.getTitle(),period.getCapacity(),Math.toIntExact(total)));count++;
    }
    if(!period.getEndAt().isAfter(now.plusDays(properties.expiryWarningDays()))){
     boolean expired=period.getEndAt().isBefore(now);
     events.publish(new AvailabilityExpiredEvent("availability:expiry:"+period.getId()+":"+(expired?"EXPIRED":"SOON"),
      period.getId(),offer.getId(),offer.getSupplier().getId(),offer.getTitle(),period.getEndAt(),expired));count++;
    }
   }
  }while(batch.size()==100);
  return count;
 }
}
