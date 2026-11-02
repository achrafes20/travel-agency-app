package com.agence.voyage.service;
import com.agence.voyage.entity.*;
import com.agence.voyage.repository.BookingRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.data.domain.PageRequest;
import org.slf4j.*;
import java.time.*;
@Component
@ConditionalOnProperty(name="booking.jobs.enabled",havingValue="true")
public class BookingJobs {
 private static final Logger log=LoggerFactory.getLogger(BookingJobs.class);
 private final BookingRepository repository;private final BookingService service;private final Clock clock;
 private final com.agence.voyage.config.BookingModuleProperties properties;
 public BookingJobs(BookingRepository repository,BookingService service,Clock clock,com.agence.voyage.config.BookingModuleProperties properties){this.repository=repository;this.service=service;this.clock=clock;this.properties=properties;}
 public void expire(){
  // Une transaction par réservation dans BookingService ; les verrous empêchent une double restitution.
  for(Booking b:repository.findByStatusAndExpiresAtBefore(BookingStatus.PENDING,LocalDateTime.now(clock),PageRequest.of(0,properties.jobs().batchSize())))
   try{service.expire(b.getId());}catch(Exception e){log.error("booking_expiration_failed bookingId={}",b.getId(),e);}
 }
 @Scheduled(fixedDelayString="${booking.jobs.completion-delay-ms:3600000}",initialDelayString="${booking.jobs.completion-delay-ms:3600000}")
 public void complete(){
  for(Booking b:repository.findByStatusAndServiceEndAtBefore(BookingStatus.CONFIRMED,LocalDateTime.now(clock),PageRequest.of(0,properties.jobs().batchSize())))
   try{service.complete(b.getId());}catch(Exception e){log.error("booking_completion_failed bookingId={}",b.getId(),e);}
 }
}

