package com.agence.voyage.service;
import com.agence.voyage.entity.*;
import com.agence.voyage.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.Set;

/** Point d'écriture unique des transitions, événements et audit, dans la transaction métier. */
@Service
public class PaymentLedger {
 private final PaymentRepository payments;private final PaymentEventRepository events;
 private final AuditService audit;private final Clock clock;
 private final NotificationEvents notifications;
 public PaymentLedger(PaymentRepository payments,PaymentEventRepository events,AuditService audit,Clock clock,NotificationEvents notifications){this.payments=payments;this.events=events;this.audit=audit;this.clock=clock;this.notifications=notifications;}
 public static boolean captured(Payment p){return Set.of(PaymentStatus.PAID,PaymentStatus.PARTIALLY_REFUNDED).contains(p.getStatus());}
 @Transactional(propagation=Propagation.MANDATORY)
 public void confirmed(Booking booking){notifications.confirmed(booking);}
 @Transactional(propagation=Propagation.MANDATORY)
 public Payment initialize(Booking b){
  if(payments.existsByBookingId(b.getId()))return payments.findByBookingIdOrderByIdAsc(b.getId()).getLast();
  return newAttempt(b);
 }
 @Transactional(propagation=Propagation.MANDATORY)
 public Payment newAttempt(Booking b){
  Payment p=new Payment();p.setBooking(b);p.setClient(b.getClient());p.setAmount(b.getTotal());p.setCreatedAt(LocalDateTime.now(clock));p.setUpdatedAt(p.getCreatedAt());
  p.setMethod(b.getPaymentMethod()==PaymentMethod.PAY_ON_ARRIVAL?PaymentMethod.CASH_ON_ARRIVAL:PaymentMethod.CARD);
  if(b.getTotal().signum()==0)p.setProvider("COMPLIMENTARY");
  p.setActiveBookingId(b.getId());payments.saveAndFlush(p);p.setProviderReference("SBX-P-"+p.getId());
  event(p,null,"INITIATED",b.getClient(),"{}");
  if(b.getTotal().signum()==0){
   p.setProvider("COMPLIMENTARY");p.setPaidAt(LocalDateTime.now(clock));change(p,PaymentStatus.PAID,"PAID",null);
   b.setStatus(BookingStatus.CONFIRMED);b.setPaymentStatus(PaymentStatus.PAID);b.setConfirmedAt(LocalDateTime.now(clock));b.setExpiresAt(null);
  }
  return p;
 }
 @Transactional(propagation=Propagation.MANDATORY)
 public void change(Payment p,PaymentStatus to,String type,User actor){
  change(p,to,type,actor,"{}");
 }
 @Transactional(propagation=Propagation.MANDATORY)
 public void change(Payment p,PaymentStatus to,String type,User actor,String details){
  PaymentStatus before=p.getStatus();com.agence.voyage.domain.PaymentTransitions.check(before,to,type);p.setStatus(to);p.setUpdatedAt(LocalDateTime.now(clock));
  p.setActiveBookingId(Set.of(PaymentStatus.PENDING,PaymentStatus.PROCESSING,PaymentStatus.PAID,PaymentStatus.PARTIALLY_REFUNDED).contains(to)?p.getBooking().getId():null);
  event(p,before,type,actor,details);
  p.getBooking().setPaymentStatus(to);
  notifications.payment(p);
 }
 @Transactional(propagation=Propagation.MANDATORY)
 public void event(Payment p,PaymentStatus before,String type,User actor,String details){
  PaymentEvent e=new PaymentEvent();e.setPayment(p);e.setFromStatus(before);e.setToStatus(p.getStatus());e.setEventType(type);e.setActor(actor);e.setActorRole(actor==null?"SYSTEM":actor.getRole().name());e.setDetails(details);e.setCreatedAt(LocalDateTime.now(clock));events.save(e);
  audit.log(actor,"PAYMENT_STATUS_CHANGED",p.getId(),before==null?null:"{\"status\":\""+before+"\"}","{\"status\":\""+p.getStatus()+"\",\"event\":\""+type+"\"}");
 }
 @Transactional(propagation=Propagation.MANDATORY)
 public boolean hasCaptured(Booking b){return payments.findByBookingIdOrderByIdAsc(b.getId()).stream().anyMatch(PaymentLedger::captured);}
 @Transactional(propagation=Propagation.MANDATORY)
 public void cancelActive(Booking b,User actor,String type){
  for(Payment p:payments.findByBookingIdOrderByIdAsc(b.getId()))
   if(p.getStatus()==PaymentStatus.PENDING||p.getStatus()==PaymentStatus.PROCESSING)change(p,PaymentStatus.CANCELLED,type,actor);
 }
}

