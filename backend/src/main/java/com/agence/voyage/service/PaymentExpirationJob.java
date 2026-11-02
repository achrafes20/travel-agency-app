package com.agence.voyage.service;
import com.agence.voyage.entity.*;
import com.agence.voyage.repository.BookingRepository;
import com.agence.voyage.config.BookingModuleProperties;
import org.springframework.stereotype.Component;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.data.domain.PageRequest;
import org.slf4j.*;
import java.time.*;

@Component @ConditionalOnProperty(name="booking.jobs.enabled",havingValue="true")
public class PaymentExpirationJob {
 private static final Logger log=LoggerFactory.getLogger(PaymentExpirationJob.class);
 private final BookingRepository repository;private final BookingService bookings;private final Clock clock;private final BookingModuleProperties properties;
 public PaymentExpirationJob(BookingRepository repository,BookingService bookings,Clock clock,BookingModuleProperties properties){this.repository=repository;this.bookings=bookings;this.clock=clock;this.properties=properties;}
 @Scheduled(fixedDelayString="${booking.jobs.expiration-delay-ms:60000}",initialDelayString="${booking.jobs.expiration-delay-ms:60000}")
 public void expire(){
  for(Booking b:repository.findByStatusAndExpiresAtBefore(BookingStatus.PENDING,LocalDateTime.now(clock),PageRequest.of(0,properties.jobs().batchSize())))
   try{bookings.expire(b.getId());}catch(RuntimeException e){log.error("payment_expiration_failed bookingId={} type={}",b.getId(),e.getClass().getSimpleName());}
 }
}

