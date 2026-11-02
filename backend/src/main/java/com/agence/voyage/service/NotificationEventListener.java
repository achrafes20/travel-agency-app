package com.agence.voyage.service;
import com.agence.voyage.entity.*;
import com.agence.voyage.event.*;
import com.agence.voyage.repository.UserRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.*;
import org.slf4j.*;
import java.math.BigDecimal;
import java.util.*;
@Component
public class NotificationEventListener {
 private static final Logger log=LoggerFactory.getLogger(NotificationEventListener.class);
 private final NotificationService notifications;private final UserRepository users;
 public NotificationEventListener(NotificationService notifications,UserRepository users){this.notifications=notifications;this.users=users;}
 private String cut(String value,int max){return value==null?"":value.length()>max?value.substring(0,max-1)+"…":value;}
 private String root(User u){return "/frontend/"+u.getRole().name().toLowerCase(Locale.ROOT)+"/index.html";}
 private void deliver(Long id,NotificationType type,String title,String message,String query,String referenceType,Long referenceId,String key){
  if(id==null)return;
  try{
   User user=users.findById(id).orElse(null);if(user==null||user.isArchived())return;
   notifications.notify(id,type,cut(title,150),cut(message,1000),root(user)+query,referenceType,referenceId,key);
  }catch(RuntimeException ex){log.warn("notification_delivery_failed userId={} type={}",id,type);}
 }
 private void booking(String key,BookingNotice b,NotificationType type,String heading,String suffix,boolean agents){
  Set<Long> recipients=new LinkedHashSet<>();recipients.add(b.clientId());
  b.lines().forEach(line->recipients.add(line.supplierId()));
  if(agents)users.findByRoleAndArchivedFalse(Role.AGENT).forEach(u->recipients.add(u.getId()));
  for(Long id:recipients){
   User recipient=users.findById(id).orElse(null);if(recipient==null)continue;
   boolean supplier=recipient.getRole()==Role.SUPPLIER;
   var lines=supplier?b.lines().stream().filter(l->id.equals(l.supplierId())).toList():b.lines();
   if(supplier&&lines.isEmpty())continue;
   BigDecimal amount=supplier?lines.stream().map(BookingNotice.Line::total).reduce(BigDecimal.ZERO,BigDecimal::add):b.total();
   String titles=lines.stream().map(l->l.title()+" × "+l.quantity()+" ("+l.startAt()+" → "+l.endAt()+")").reduce((a,c)->a+" ; "+c).orElse("");
   String query=switch(recipient.getRole()){
    case CLIENT -> "?page=reservation&id="+b.bookingId();case AGENT -> "?page=booking&id="+b.bookingId();default -> "?page=bookings";
   };
   deliver(id,type,heading+" "+b.reference(),b.reference()+" — "+titles+"\nMontant "+(supplier?"de vos prestations":"total")+" : "+amount+" MAD."+suffix,
    query,"BOOKING",b.bookingId(),key);
  }
 }
 @TransactionalEventListener(phase=TransactionPhase.AFTER_COMMIT)
 public void registered(UserRegisteredEvent e){
  deliver(e.userId(),NotificationType.ACCOUNT_WELCOME,"Bienvenue chez Atlas Voyage",
   "Votre compte est prêt. Découvrez nos offres et retrouvez vos voyages dans votre espace personnel.",
   "?page=notifications","USER",e.userId(),e.eventId());
 }
 @TransactionalEventListener(phase=TransactionPhase.AFTER_COMMIT)
 public void created(BookingCreatedEvent e){safe(()->booking(e.eventId(),e.booking(),NotificationType.BOOKING_CREATED,"Nouvelle réservation","",true));}
 @TransactionalEventListener(phase=TransactionPhase.AFTER_COMMIT)
 public void confirmed(BookingConfirmedEvent e){safe(()->booking(e.eventId(),e.booking(),NotificationType.BOOKING_CONFIRMED,"Réservation confirmée","",false));}
 @TransactionalEventListener(phase=TransactionPhase.AFTER_COMMIT)
 public void cancelled(BookingCancelledEvent e){safe(()->booking(e.eventId(),e.booking(),NotificationType.BOOKING_CANCELLED,"Réservation annulée",
  "\nAuteur : "+cut(e.cancelledBy(),80)+". Motif : "+cut(e.reason(),250)+". Un remboursement éventuel est traité séparément et consultable dans le paiement.",true));}
 @TransactionalEventListener(phase=TransactionPhase.AFTER_COMMIT)
 public void received(PaymentReceivedEvent e){safe(()->booking(e.eventId(),e.booking(),NotificationType.PAYMENT_RECEIVED,"Paiement reçu",
  "\nMéthode : "+(e.method().equals("CARD")?"carte":"paiement à l'arrivée")+". Reçu le "+e.paidAt()+".",false));}
 @TransactionalEventListener(phase=TransactionPhase.AFTER_COMMIT)
 public void failed(PaymentFailedEvent e){
  deliver(e.booking().clientId(),NotificationType.PAYMENT_FAILED,"Le paiement n'a pas abouti",
   e.booking().reference()+" — "+cut(e.failureMessage(),400)+". Vous pouvez réessayer avant expiration.",
   "?page=payment&id="+e.booking().bookingId(),"PAYMENT",e.paymentId(),e.eventId());
 }
 @TransactionalEventListener(phase=TransactionPhase.AFTER_COMMIT)
 public void moderation(OfferModerationChangedEvent e){
  deliver(e.supplierId(),e.active()?NotificationType.OFFER_REACTIVATED:NotificationType.OFFER_DEACTIVATED,
   e.active()?"Votre offre a été réactivée":"Votre offre a été désactivée",
   e.title()+" — Motif : "+cut(e.reason()==null?"Réactivation par l'administrateur":e.reason(),700),
   "?page=offers","OFFER",e.offerId(),e.eventId());
 }
 @TransactionalEventListener(phase=TransactionPhase.AFTER_COMMIT)
 public void low(AvailabilityLowEvent e){
  deliver(e.supplierId(),NotificationType.AVAILABILITY_LOW,"Capacité bientôt épuisée",
   e.title()+" — Il reste "+e.remaining()+" unité(s) disponible(s) sur cette période.",
   "?page=inventory","AVAILABILITY",e.availabilityId(),e.eventId());
 }
 @TransactionalEventListener(phase=TransactionPhase.AFTER_COMMIT)
 public void expired(AvailabilityExpiredEvent e){
  deliver(e.supplierId(),NotificationType.AVAILABILITY_EXPIRED,e.expired()?"Période de disponibilité terminée":"Disponibilité bientôt expirée",
   e.title()+" — Fin de période : "+e.endAt()+". Vérifiez vos disponibilités.",
   "?page=inventory","AVAILABILITY",e.availabilityId(),e.eventId());
 }
 @TransactionalEventListener(phase=TransactionPhase.AFTER_COMMIT)
 public void ticket(TicketRepliedEvent e){
  Set<Long> ids=new LinkedHashSet<>();ids.add(e.requesterId());
  if(Objects.equals(e.authorId(),e.requesterId()))ids.add(e.assignedId());
  ids.remove(e.authorId());ids.remove(null);
  for(Long id:ids)deliver(id,NotificationType.TICKET_REPLY,"Nouvelle réponse à votre ticket",
   e.reference()+" — "+cut(e.subject(),150)+" : "+cut(e.replyPreview(),650),
   "?page=tickets&id="+e.ticketId(),"TICKET",e.ticketId(),e.eventId());
 }
 private void safe(Runnable action){try{action.run();}catch(RuntimeException ex){log.warn("notification_event_failed");}}
}
