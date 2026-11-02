package com.agence.voyage.service;
import com.agence.voyage.event.*;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.*;
@Component
public class StatsCacheInvalidation {
 private final CacheManager caches;
 public StatsCacheInvalidation(CacheManager caches){this.caches=caches;}
 @TransactionalEventListener(phase=TransactionPhase.AFTER_COMMIT,classes={BookingCreatedEvent.class,BookingConfirmedEvent.class,
  BookingCancelledEvent.class,PaymentReceivedEvent.class,PaymentFailedEvent.class,UserRegisteredEvent.class,OfferModerationChangedEvent.class})
 public void invalidate(){var cache=caches.getCache("adminStats");if(cache!=null)cache.clear();}
}
