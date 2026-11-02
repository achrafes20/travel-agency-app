package com.agence.voyage.service;
import com.agence.voyage.entity.*;
import com.agence.voyage.event.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.slf4j.*;
import java.util.*;
/** Snapshots simples capturés dans la transaction métier, sans entités dans les événements. */
@Component
public class NotificationEvents {
 private static final Logger log=LoggerFactory.getLogger(NotificationEvents.class);
 private final ApplicationEventPublisher publisher;
 public NotificationEvents(ApplicationEventPublisher publisher){this.publisher=publisher;}
 public void publish(Object event){
  try{publisher.publishEvent(event);}
  catch(RuntimeException ex){log.warn("notification_event_publication_failed type={}",event.getClass().getSimpleName());}
 }
 public BookingNotice snapshot(Booking b){
  return new BookingNotice(b.getId(),b.getClient().getId(),b.getReference(),b.getTotal(),
   b.getServiceStartAt(),b.getServiceEndAt(),b.getItems().stream().filter(i->i.getOffer()!=null)
    .map(i->new BookingNotice.Line(i.getSupplier().getId(),i.getTitleSnapshot(),i.getQuantity(),i.getLineTotal(),
     i.getServiceStartAt(),i.getServiceEndAt())).toList());
 }
 public void created(Booking b){publish(new BookingCreatedEvent("booking:created:"+b.getId(),snapshot(b)));}
 public void confirmed(Booking b){publish(new BookingConfirmedEvent("booking:confirmed:"+b.getId(),snapshot(b)));}
 public void cancelled(Booking b,String author){publish(new BookingCancelledEvent("booking:cancelled:"+b.getId(),snapshot(b),b.getCancellationReason(),author));}
 public void payment(Payment p){
  if(p.getStatus()==PaymentStatus.PAID)publish(new PaymentReceivedEvent("payment:received:"+p.getId(),p.getId(),
   snapshot(p.getBooking()),p.getAmount(),p.getMethod().name(),p.getPaidAt()));
  if(p.getStatus()==PaymentStatus.FAILED)publish(new PaymentFailedEvent("payment:failed:"+p.getId(),p.getId(),snapshot(p.getBooking()),p.getFailureMessage()));
 }
}
