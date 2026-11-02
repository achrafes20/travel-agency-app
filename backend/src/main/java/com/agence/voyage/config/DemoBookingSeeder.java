package com.agence.voyage.config;

import com.agence.voyage.dto.*;
import com.agence.voyage.entity.*;
import com.agence.voyage.repository.*;
import com.agence.voyage.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.*;
import org.springframework.transaction.support.TransactionTemplate;
import org.slf4j.*;
import java.time.*;
import java.util.*;

/** Démonstrations réelles en sandbox. Aucun appel gateway n'est entouré d'une transaction de seeding. */
@Component @Order(10)
@ConditionalOnProperty(name="app.seed.enabled",havingValue="true")
public class DemoBookingSeeder implements CommandLineRunner {
 private static final Logger log=LoggerFactory.getLogger(DemoBookingSeeder.class);
 private final BookingRepository bookings;private final UserRepository users;private final OfferRepository offers;
 private final CartRepository carts;private final BookingService bookingService;private final ObjectMapper mapper;
 private final Clock clock;private final PaymentService paymentService;private final PaymentRepository payments;private final TransactionTemplate tx;
 public DemoBookingSeeder(BookingRepository bookings,UserRepository users,OfferRepository offers,CartRepository carts,
  BookingService bookingService,ObjectMapper mapper,Clock clock,PaymentService paymentService,PaymentRepository payments,PlatformTransactionManager manager){
  this.bookings=bookings;this.users=users;this.offers=offers;this.carts=carts;this.bookingService=bookingService;
  this.mapper=mapper;this.clock=clock;this.paymentService=paymentService;this.payments=payments;this.tx=new TransactionTemplate(manager);
 }
 @Override public void run(String...args){
  Long client=users.findByEmailIgnoreCase("sarah.benali@example.com").orElseThrow().getId();
  Long admin=users.findByEmailIgnoreCase("omar.tazi@atlasvoyage.ma").orElseThrow().getId();
  for(String scenario:List.of("paid","cash","failed","partial")){
   Long id=tx.execute(status->prepare(client,scenario));if(id==null)continue;
   List<PaymentResponse> current=tx.execute(status->payments.findByBookingIdOrderByIdAsc(id).stream().map(PaymentResponse::from).toList());
   if(current.stream().anyMatch(p->p.status()==PaymentStatus.PARTIALLY_REFUNDED||p.status()==PaymentStatus.REFUNDED))continue;
   boolean captured=current.stream().anyMatch(p->p.status()==PaymentStatus.PAID);
   if(scenario.equals("paid")&&captured||scenario.equals("cash")&&current.stream().anyMatch(p->p.method()==PaymentMethod.CASH_ON_ARRIVAL&&p.status()==PaymentStatus.PENDING)
     ||scenario.equals("failed")&&current.stream().anyMatch(p->p.status()==PaymentStatus.FAILED))continue;
   BookingStatus bookingStatus=bookings.findById(id).orElseThrow().getStatus();
   if(bookingStatus==BookingStatus.EXPIRED||bookingStatus==BookingStatus.CANCELLED)continue;
   PaymentResponse result;
   if(captured)result=current.stream().filter(p->p.status()==PaymentStatus.PAID).findFirst().orElseThrow();
   else result=paymentService.initiate(client,"demo_phase3_"+scenario+"_"+id,
     new PaymentCreateRequest(id,scenario.equals("cash")?PaymentMethod.CASH_ON_ARRIVAL:PaymentMethod.CARD,
      scenario.equals("cash")?null:scenario.equals("failed")?"tok_sandbox_declined":"tok_sandbox_success",
      scenario.equals("cash")?null:scenario.equals("failed")?"0002":"4242",scenario.equals("cash")?null:"VISA"),null).body();
   if(scenario.equals("partial"))paymentService.refund(admin,result.id(),"demo_phase3_partial_refund_"+id,
     new PaymentRefundRequest(result.amount().divide(java.math.BigDecimal.valueOf(2),2,java.math.RoundingMode.HALF_UP),"Démonstration : remboursement partiel sandbox"),null);
  }
  log.info("payment_demo_ready provider=SANDBOX");
 }
 private Long prepare(Long clientId,String scenario){
  String marker="demo:payment:phase3:"+scenario;
  var existing=bookings.findAll((r,q,cb)->cb.and(cb.equal(r.get("client").get("id"),clientId),cb.equal(r.get("notes"),marker)),org.springframework.data.domain.PageRequest.of(0,1));
  if(!existing.isEmpty())return existing.getContent().getFirst().getId();
  User client=users.findById(clientId).orElseThrow();
  Cart cart=carts.lockByClientId(clientId).orElseGet(()->{Cart c=new Cart();c.setClient(client);return carts.saveAndFlush(c);});
  if(!cart.getItems().isEmpty()){log.info("payment_demo_skipped reason=client_cart_not_empty");return null;}
  Offer hotel=offers.findByTitleIgnoreCase("Riad Atlas Prestige").orElse(null);
  if(hotel==null||!Boolean.TRUE.equals(hotel.getActive())||scenario.equals("cash")&&!Boolean.TRUE.equals(hotel.getAllowsPayOnArrival()))return null;
  LocalDateTime wanted=LocalDateTime.now(clock).plusDays(3).toLocalDate().atTime(14,0);
  var available=hotel.getAvailabilities().stream().filter(a->a.getCapacity()>0&&!a.getEndAt().isBefore((a.getStartAt().isAfter(wanted)?a.getStartAt():wanted).plusDays(1))).findFirst();
  if(available.isEmpty()){log.info("payment_demo_skipped reason=no_capacity");return null;}
  LocalDateTime start=available.get().getStartAt().isAfter(wanted)?available.get().getStartAt():wanted;
  try{
   CartItem item=new CartItem();item.setCart(cart);item.setOffer(hotel);item.setQuantity(1);
   item.setTravelCriteria(mapper.writeValueAsString(Map.of("startDate",start.toString(),"endDate",start.plusDays(1).toString(),"travelers",1)));
   cart.getItems().add(item);carts.saveAndFlush(cart);
   return bookingService.createFromCart(clientId,new CreateBookingRequest(scenario.equals("cash")?PaymentMethod.PAY_ON_ARRIVAL:PaymentMethod.ONLINE,null,marker)).id();
  }catch(com.fasterxml.jackson.core.JsonProcessingException e){throw new IllegalStateException("Critères de démonstration invalides",e);}
 }
}

