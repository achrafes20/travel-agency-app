package com.agence.voyage.config;
import com.agence.voyage.entity.*;
import com.agence.voyage.repository.*;
import com.agence.voyage.service.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.math.*;
import java.time.*;
import java.util.*;
import org.slf4j.*;
/** Historique de démonstration explicite ; aucune capture gateway ni notification artificielle. */
@Component @Profile("dev") @Order(20) @ConditionalOnProperty(name="app.seed.enabled",havingValue="true")
public class StatsDemoSeeder implements CommandLineRunner {
 private static final Logger log=LoggerFactory.getLogger(StatsDemoSeeder.class);
 private final UserRepository users;private final OfferRepository offers;private final BookingRepository bookings;
 private final PaymentRepository payments;private final PromoCodeRepository promos;private final PaymentEventRepository events;
 private final AuditService audit;private final PasswordEncoder passwords;private final AppProperties properties;private final Clock clock;
 public StatsDemoSeeder(UserRepository users,OfferRepository offers,BookingRepository bookings,PaymentRepository payments,
 PromoCodeRepository promos,PaymentEventRepository events,AuditService audit,PasswordEncoder passwords,AppProperties properties,Clock clock){
  this.users=users;this.offers=offers;this.bookings=bookings;this.payments=payments;this.promos=promos;this.events=events;
  this.audit=audit;this.passwords=passwords;this.properties=properties;this.clock=clock;
 }
 @Override @Transactional public void run(String...args){
  User sarah=users.findByEmailIgnoreCase("sarah.benali@example.com").orElseThrow();
  User second=users.findByEmailIgnoreCase("client.stats.demo@atlasvoyage.test").orElseGet(()->{
   User u=new User("Yasmine Démo","client.stats.demo@atlasvoyage.test",passwords.encode(properties.seed().password()),Role.CLIENT);
   u.setEmailVerified(true);
   u.setCountry("MA");u.setPhone("+212612345678");
   u.setCreatedAt(StatsPeriod.utc(LocalDate.now(clock.withZone(StatsPeriod.ZONE)).withDayOfMonth(1).minusMonths(11)));
   return users.save(u);
  });
  User agent=users.findByEmailIgnoreCase("nadia.elfassi@atlasvoyage.ma").orElseThrow();
  List<Offer> services=offers.findAll().stream().filter(o->Boolean.TRUE.equals(o.getActive())&&!o.getSupplier().isArchived())
   .sorted(Comparator.comparing(Offer::getId)).toList();
  if(services.isEmpty())return;
  PromoCode discount=promo("DEMO_STATS10",true,DiscountType.PERCENTAGE,"10");
  PromoCode inactive=promo("DEMO_STATS_ARCHIVE",false,DiscountType.FIXED,"50");
  YearMonth current=YearMonth.from(LocalDate.now(clock.withZone(StatsPeriod.ZONE)));int inserted=0;
  for(int month=11;month>=0;month--)for(int index=0;index<5;index++){
   YearMonth cohort=current.minusMonths(month);String marker="demo:stats:"+cohort+":"+index;
   if(bookings.existsByNotes(marker))continue;
   Offer offer=services.get(Math.floorMod(month*5+index,services.size()));
   if(month==0&&(index==1||index==4))offer=services.stream().filter(o->o instanceof Hotel&&Boolean.TRUE.equals(o.getAllowsPayOnArrival()))
     .skip(index==1?1:0).findFirst().orElse(services.getFirst());
   if(create(month,index,cohort,marker,index%2==0?sarah:second,offer,agent,index==0?discount:index==2?inactive:null))inserted++;
  }
  log.info("stats_demo_ready bookingsAdded={}",inserted);
 }
 private PromoCode promo(String code,boolean active,DiscountType type,String value){
  return promos.findByCodeIgnoreCase(code).orElseGet(()->{
   PromoCode p=new PromoCode();p.setCode(code);p.setDiscountType(type);p.setValue(new BigDecimal(value));p.setActive(active);
   p.setExpiryDate(LocalDate.now(clock.withZone(StatsPeriod.ZONE)).plusDays(5));return promos.save(p);
  });
 }
 private boolean create(int month,int index,YearMonth cohort,String marker,User client,Offer offer,User agent,PromoCode promo){
  LocalDateTime now=LocalDateTime.now(clock);
  LocalDateTime created=month==0?(index==4?now:now.minusHours(index==0?4:2).minusMinutes(index)):
   StatsPeriod.utc(cohort.atDay(10+index)).plusHours(10);
  BookingStatus status=index==2?BookingStatus.CANCELLED:index==3?BookingStatus.EXPIRED:
   month==0&&index==4?BookingStatus.PENDING:month==0&&index==1?BookingStatus.CONFIRMED:BookingStatus.COMPLETED;
  LocalDateTime start=month>0||status==BookingStatus.COMPLETED?created.plusHours(month==0?1:48):now.plusDays(4+index);
  LocalDateTime end=start.plusHours(2);
  OfferAvailability period;
  if(month==0&&status!=BookingStatus.COMPLETED){
   period=offer.getAvailabilities().stream().filter(a->a.getCapacity()>0&&a.getEndAt().isAfter(now.plusDays(1))).findFirst().orElse(null);
   if(period==null){log.info("stats_demo_skipped reason=no_future_capacity");return false;}
   start=period.getStartAt().isAfter(now.plusDays(1))?period.getStartAt():now.plusDays(1);
   end=start.plusHours(1);if(end.isAfter(period.getEndAt()))end=period.getEndAt();
  }else{
   final LocalDateTime serviceStart=start,serviceEnd=end;
   // Réutiliser l'intersection existante : ne jamais créer une période chevauchante.
   period=offer.getAvailabilities().stream().filter(a->a.getStartAt().isBefore(serviceEnd)&&a.getEndAt().isAfter(serviceStart)).findFirst().orElse(null);
   if(period==null){
    period=new OfferAvailability(start,end,100);
    int position=offer.getAvailabilities().size();offer.getAvailabilities().add(period);
    // merge peut remplacer l'enfant transitoire par sa copie gérée : allouer celle-ci.
    period=offers.saveAndFlush(offer).getAvailabilities().get(position);
   }else{if(start.isBefore(period.getStartAt()))start=period.getStartAt();if(end.isAfter(period.getEndAt()))end=period.getEndAt();}
  }
  int quantity=month==0?1:1+(index%2);
  boolean restored=status==BookingStatus.CANCELLED||status==BookingStatus.EXPIRED;
  if(!restored&&period.getCapacity()<quantity)return false;
  Booking b=new Booking();b.setClient(client);b.setReference("DEMO-STATS-"+cohort.toString().replace("-","")+"-"+index);
  b.setNotes(marker);b.setStatus(status);b.setCreatedAt(created);b.setServiceStartAt(start);b.setServiceEndAt(end);
  b.setPaymentMethod(month==0&&index==1&&Boolean.TRUE.equals(offer.getAllowsPayOnArrival())?PaymentMethod.PAY_ON_ARRIVAL:PaymentMethod.ONLINE);
  BigDecimal price=BookingPricing.offer(offer),subtotal=price.multiply(BigDecimal.valueOf(quantity));
  b.setSubtotal(subtotal);b.setDiscount(promo==null?BigDecimal.ZERO.setScale(2):BookingPricing.discount(promo,subtotal));b.setTotal(subtotal.subtract(b.getDiscount()));
  if(promo!=null){b.setPromoCode(promo);b.setPromoCodeSnapshot(promo.getCode());b.setPromoTypeSnapshot(promo.getDiscountType());b.setPromoValueSnapshot(promo.getValue());}
  PaymentStatus paymentStatus=status==BookingStatus.CANCELLED?PaymentStatus.REFUNDED:status==BookingStatus.EXPIRED?PaymentStatus.CANCELLED:
   status==BookingStatus.PENDING||b.getPaymentMethod()==PaymentMethod.PAY_ON_ARRIVAL?PaymentStatus.PENDING:PaymentStatus.PAID;
  b.setPaymentStatus(paymentStatus);
  if(status==BookingStatus.PENDING||status==BookingStatus.EXPIRED)b.setExpiresAt(created.plusMinutes(30));
  if(status==BookingStatus.CONFIRMED||status==BookingStatus.COMPLETED)b.setConfirmedAt(created.plusMinutes(1));
  if(status==BookingStatus.CANCELLED){b.setCancelledAt(created.plusMinutes(30));b.setCancelledBy(agent.getId());b.setCancellationReason("Démonstration statistique : annulation avec remboursement sandbox");}
  BookingItem item=new BookingItem();item.setBooking(b);item.setOffer(offer);item.setSupplier(offer.getSupplier());item.setTitleSnapshot(offer.getTitle());
  item.setQuantity(quantity);item.setUnitPrice(price);item.setLineTotal(subtotal);item.setServiceStartAt(start);item.setServiceEndAt(end);
  item.setTravelCriteria("{\"startDate\":\""+start+"\",\"endDate\":\""+end+"\",\"travelers\":1}");
  BookingItemAllocation allocation=new BookingItemAllocation();allocation.setBookingItem(item);allocation.setAvailability(period);allocation.setQuantity(quantity);allocation.setRestored(restored);
  item.getAllocations().add(allocation);b.getItems().add(item);
  if(!restored)period.setCapacity(period.getCapacity()-quantity);
  bookings.saveAndFlush(b);offers.saveAndFlush(offer);
  Payment payment=new Payment();payment.setBooking(b);payment.setClient(client);payment.setAmount(b.getTotal());payment.setStatus(paymentStatus);
  payment.setMethod(b.getPaymentMethod()==PaymentMethod.PAY_ON_ARRIVAL?PaymentMethod.CASH_ON_ARRIVAL:PaymentMethod.CARD);
  payment.setCreatedAt(created);payment.setUpdatedAt(created);payment.setProvider("SANDBOX");
  if(paymentStatus==PaymentStatus.PAID||paymentStatus==PaymentStatus.REFUNDED)payment.setPaidAt(created.plusMinutes(1));
  if(paymentStatus==PaymentStatus.REFUNDED){payment.setRefundedAmount(b.getTotal());payment.setRefundedAt(b.getCancelledAt());}
  if(paymentStatus==PaymentStatus.PAID||paymentStatus==PaymentStatus.PENDING)payment.setActiveBookingId(b.getId());
  payments.saveAndFlush(payment);payment.setProviderReference("DEMO-STATS-P-"+payment.getId());
  PaymentEvent event=new PaymentEvent();event.setPayment(payment);event.setToStatus(paymentStatus);event.setEventType("DEMO_STATS_IMPORTED");event.setActorRole("SYSTEM");
  event.setDetails("{\"demonstration\":true}");event.setCreatedAt(created);events.save(event);
  audit.log(null,"PAYMENT_STATS_DEMO_IMPORTED",payment.getId(),null,"{\"status\":\""+paymentStatus+"\",\"demonstration\":true}");
  return true;
 }
}
