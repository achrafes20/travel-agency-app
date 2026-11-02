package com.agence.voyage.payment;

import com.agence.voyage.config.*;
import com.agence.voyage.dto.*;
import com.agence.voyage.entity.*;
import com.agence.voyage.entity.Role;
import com.agence.voyage.exception.*;
import com.agence.voyage.repository.*;
import com.agence.voyage.service.*;
import com.agence.voyage.security.AppUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.*;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.context.annotation.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.*;
import org.springframework.transaction.*;
import org.springframework.transaction.support.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.function.Supplier;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

@SpringBootTest(properties="spring.datasource.url=jdbc:h2:mem:phase3_payments_${random.uuid};MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
@AutoConfigureMockMvc @ActiveProfiles("test") @Import(PaymentTestSupport.TimeConfig.class)
abstract class PaymentTestSupport {
 static class MutableClock extends Clock {
  volatile Instant value=Instant.parse("2026-11-01T12:00:00Z");
  public Instant instant(){return value;}public ZoneId getZone(){return ZoneOffset.UTC;}public Clock withZone(ZoneId zone){return this;}
 }
 @TestConfiguration static class TimeConfig{@Bean @Primary MutableClock testClock(){return new MutableClock();}}
 @Autowired MutableClock clock;@Autowired PaymentService service;@Autowired PaymentRepository payments;
 @Autowired PaymentEventRepository events;@Autowired AuditLogRepository audit;@Autowired PaymentQueries queries;
 @Autowired PaymentWebhookService webhook;@Autowired PaymentProperties properties;@Autowired PaymentDataGuard guard;
 @Autowired PaymentIdempotency idempotency;@Autowired BookingService bookingService;@Autowired BookingRepository bookings;
 @Autowired UserRepository users;@Autowired CityRepository cities;@Autowired OfferRepository offers;@Autowired CartRepository carts;
 @Autowired OfferAvailabilityRepository periods;@Autowired IdempotencyRecordRepository records;
 @Autowired WebhookEventRepository webhookEvents;@Autowired PlatformTransactionManager manager;@Autowired BookingModuleProperties bookingProperties;
 @Autowired MockMvc mvc;@Autowired ObjectMapper mapper;@Autowired EntityManager em;
 @SpyBean SandboxPaymentGateway gateway;
 User client,other,supplier,agent,agent2,admin;Offer hotel;Long availabilityId;
 <T>T tx(Supplier<T> operation){return new TransactionTemplate(manager).execute(s->operation.get());}
 User account(Role role){return users.save(new User("Utilisateur "+role,"phase3-"+UUID.randomUUID()+"@test.ma","hash",role));}
 @BeforeEach void fixture(){
  clock.value=Instant.parse("2026-11-01T12:00:00Z");
  tx(()->{
   client=account(Role.CLIENT);other=account(Role.CLIENT);supplier=account(Role.SUPPLIER);agent=account(Role.AGENT);agent2=account(Role.AGENT);admin=account(Role.ADMIN);
   City city=cities.save(new City("Ville "+UUID.randomUUID(),1d,2d));
   Hotel h=new Hotel();h.setTitle("Hôtel "+UUID.randomUUID());h.setBasePrice(1000d);h.setCity(city);h.setSupplier(supplier);h.setAllowsPayOnArrival(true);h.setActive(true);
   h.setAvailabilities(List.of(new OfferAvailability(LocalDateTime.parse("2026-11-01T00:00"),LocalDateTime.parse("2026-12-31T23:59"),40)));
   hotel=offers.saveAndFlush(h);availabilityId=hotel.getAvailabilities().getFirst().getId();return null;
  });
  org.mockito.Mockito.reset(gateway);
 }
 String key(){return UUID.randomUUID().toString();}
 BookingResponse booking(PaymentMethod method){
  tx(()->{
   Cart c=carts.findByClientId(client.getId()).orElseGet(()->{Cart a=new Cart();a.setClient(client);return carts.save(a);});
   CartItem i=new CartItem();i.setCart(c);i.setOffer(hotel);i.setQuantity(1);
   i.setTravelCriteria("{\"startDate\":\"2026-11-10T14:00\",\"endDate\":\"2026-11-12T11:00\",\"travelers\":1}");
   c.getItems().add(i);carts.saveAndFlush(c);return null;
  });
  return bookingService.createFromCart(client.getId(),new CreateBookingRequest(method,null,null));
 }
 PaymentCreateRequest card(Long id,String token){return new PaymentCreateRequest(id,PaymentMethod.CARD,token,"4242","VISA");}
 PaymentResponse pay(BookingResponse b,String token){return service.initiate(client.getId(),key(),card(b.id(),token),null).body();}
 PaymentResponse cash(){BookingResponse b=booking(PaymentMethod.PAY_ON_ARRIVAL);return queries.forBooking(client.getId(),b.id()).getFirst();}
 void error(ErrorCode code,org.junit.jupiter.api.function.Executable operation){assertEquals(code,assertThrows(BusinessException.class,operation).getCode());}
 int capacity(){return periods.findById(availabilityId).orElseThrow().getCapacity();}
 long auditCount(Long id){return audit.findByResourceTypeAndResourceIdOrderByIdAsc("PAYMENT",id).size();}
 ResultActions postPayment(String body,String key,User user)throws Exception{
  var request=post("/api/payments").with(user(new AppUserDetails(user))).contentType("application/json").content(body);
  if(key!=null)request.header("Idempotency-Key",key);return mvc.perform(request);
 }
 byte[] payload(String id,String type,PaymentResponse p,String extra)throws Exception{
  return ("{\"eventId\":\""+id+"\",\"type\":\""+type+"\",\"providerReference\":\""+p.providerReference()+"\""+extra+"}").getBytes(java.nio.charset.StandardCharsets.UTF_8);
 }
 PaymentWebhookService.Reply send(byte[] body){return webhook.receive(body,webhook.signature(body),Long.toString(clock.instant().getEpochSecond()));}
}

