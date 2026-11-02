package com.agence.voyage.booking;

import com.agence.voyage.config.*;
import com.agence.voyage.dto.*;
import com.agence.voyage.entity.*;
import com.agence.voyage.entity.Role;
import com.agence.voyage.exception.*;
import com.agence.voyage.repository.*;
import com.agence.voyage.service.*;
import com.agence.voyage.security.AppUserDetails;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.*;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.context.annotation.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.http.MediaType;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.function.Supplier;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties="spring.datasource.url=jdbc:h2:mem:booking_integration_${random.uuid};MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
@AutoConfigureMockMvc @ActiveProfiles("test") @Import(BookingIntegrationTest.TimeConfig.class)
class BookingIntegrationTest {
 static class MutableClock extends Clock {
  volatile Instant instant=Instant.parse("2026-11-01T12:00:00Z");
  public ZoneId getZone(){return ZoneOffset.UTC;}public Clock withZone(ZoneId zone){return this;}public Instant instant(){return instant;}
 }
 @TestConfiguration static class TimeConfig {@Bean @Primary MutableClock testClock(){return new MutableClock();}}
 @Autowired MutableClock clock;@Autowired BookingService service;@Autowired BookingRepository bookings;
 @Autowired BookingItemRepository items;@Autowired CartRepository carts;@Autowired UserRepository users;
 @Autowired OfferRepository offers;@Autowired OfferAvailabilityRepository periods;@Autowired CityRepository cities;
 @Autowired PromoCodeRepository promos;@Autowired BundleRepository bundles;@Autowired MockMvc mvc;
 @Autowired BookingVoucherService vouchers;@Autowired PlatformTransactionManager tm;
 @Autowired com.fasterxml.jackson.databind.ObjectMapper mapper;
 @Autowired PaymentService paymentService;@Autowired PaymentRepository paymentRepository;
 PaymentResponse pay(Long bookingId){return paymentService.initiate(client.getId(),UUID.randomUUID().toString(),new PaymentCreateRequest(bookingId,PaymentMethod.CARD,"tok_sandbox_success","4242","VISA"),null).body();}
 User client,other,supplier,supplier2,agent,admin;Offer hotel,excursion;City city;Long periodId;
 <T>T tx(Supplier<T> action){return new TransactionTemplate(tm).execute(s->action.get());}
 User account(Role role){return users.save(new User(role.name(),"booking-"+UUID.randomUUID()+"@test.ma","hash",role));}
 @BeforeEach void setup(){
  clock.instant=Instant.parse("2026-11-01T12:00:00Z");
  tx(()->{client=account(Role.CLIENT);other=account(Role.CLIENT);supplier=account(Role.SUPPLIER);supplier2=account(Role.SUPPLIER);agent=account(Role.AGENT);admin=account(Role.ADMIN);city=cities.save(new City("Booking-"+UUID.randomUUID(),1d,2d));hotel=offer(new Hotel(),supplier,1000d,10);excursion=offer(new Excursion(),supplier2,500d,10);periodId=hotel.getAvailabilities().get(0).getId();return null;});
 }
 Offer offer(Offer o,User owner,double price,int capacity){
  o.setTitle("Offre "+UUID.randomUUID());o.setSupplier(owner);o.setCity(city);o.setBasePrice(price);o.setActive(true);o.setAllowsPayOnArrival(true);
  o.setAvailabilities(List.of(new OfferAvailability(LocalDateTime.parse("2026-11-01T00:00:00"),LocalDateTime.parse("2028-12-31T23:59:00"),capacity)));
  return offers.saveAndFlush(o);
 }
 String travel(){return "{\"startDate\":\"2026-11-10\",\"endDate\":\"2026-11-12\",\"travelers\":2}";}
 void line(User u,Offer offer,int quantity,String json){
  tx(()->{Cart c=carts.findByClientId(u.getId()).orElseGet(()->{Cart a=new Cart();a.setClient(u);return carts.save(a);});CartItem i=new CartItem();i.setCart(c);i.setOffer(offer);i.setQuantity(quantity);i.setTravelCriteria(json);c.getItems().add(i);carts.saveAndFlush(c);return null;});
 }
 BookingResponse create(PaymentMethod method){return service.createFromCart(client.getId(),new CreateBookingRequest(method,null,null));}
 int capacity(){return periods.findById(periodId).orElseThrow().getCapacity();}
 void error(ErrorCode code,org.junit.jupiter.api.function.Executable action){assertEquals(code,assertThrows(BusinessException.class,action).getCode());}
 void promo(DiscountType type,String value,LocalDate expiry){
  tx(()->{PromoCode p=new PromoCode();p.setCode("CODE"+UUID.randomUUID());p.setDiscountType(type);p.setValue(new BigDecimal(value));p.setExpiryDate(expiry);p=promos.save(p);Cart c=carts.findByClientId(client.getId()).orElseThrow();c.setPromoCode(p);return null;});
 }
 @Test void simpleOnlineSnapshotsAndCartCleared(){
  line(client,hotel,2,travel());BookingResponse b=create(PaymentMethod.ONLINE);
  assertEquals(BookingStatus.PENDING,b.status());assertEquals(PaymentStatus.PENDING,b.paymentStatus());assertEquals(new BigDecimal("2000.00"),b.total());
  assertEquals(LocalDateTime.now(clock).plusMinutes(30),b.expiresAt());assertEquals(8,capacity());assertTrue(b.reference().matches("BK-2026-\\d{6}"));
  assertEquals(0,tx(()->carts.findByClientId(client.getId()).orElseThrow().getItems().size()));
  tx(()->{Offer o=offers.findById(hotel.getId()).orElseThrow();o.setBasePrice(9d);return null;});
  assertEquals(new BigDecimal("2000.00"),service.get(client.getId(),b.id()).total());
 }
 @Test void payOnArrivalConfirmed(){line(client,hotel,1,travel());var b=create(PaymentMethod.PAY_ON_ARRIVAL);assertEquals(BookingStatus.CONFIRMED,b.status());assertEquals(PaymentStatus.PENDING,b.paymentStatus());assertNull(b.expiresAt());assertTrue(b.voucherAvailable());}
 @Test void bundleConsumesAllAndSupplierScoped(){
  tx(()->{Bundle bundle=new Bundle();bundle.setTitle("Combiné");bundle.setCreatedBy(agent);bundle.setDiscountPercentage(10d);bundle.setOffers(List.of(hotel,excursion));bundles.save(bundle);
   Cart c=new Cart();c.setClient(client);CartItem i=new CartItem();i.setCart(c);i.setBundle(bundle);i.setQuantity(2);i.setTravelCriteria(travel());c.getItems().add(i);carts.saveAndFlush(c);return null;});
  var b=create(PaymentMethod.PAY_ON_ARRIVAL);assertEquals(new BigDecimal("2700.00"),b.total());assertEquals(3,b.items().size());assertEquals(8,capacity());
  tx(()->{assertEquals(8,offers.findById(excursion.getId()).orElseThrow().getAvailabilities().get(0).getCapacity());return null;});
  var scoped=service.get(supplier.getId(),b.id());assertEquals(1,scoped.items().size());assertNull(scoped.clientEmail());assertEquals(new BigDecimal("1800.00"),scoped.total());assertNull(scoped.items().get(0).parentItemId());
 }
 @Test void fixedPromo(){line(client,hotel,1,travel());promo(DiscountType.FIXED,"1200",null);var b=create(PaymentMethod.ONLINE);assertEquals(new BigDecimal("1000.00"),b.discount());assertEquals(new BigDecimal("0.00"),b.total());}
 @Test void percentagePromo(){line(client,hotel,1,travel());promo(DiscountType.PERCENTAGE,"12.35",null);var b=create(PaymentMethod.ONLINE);assertEquals(new BigDecimal("123.50"),b.discount());assertEquals(new BigDecimal("876.50"),b.total());assertNotNull(b.promoCode());}
 @Test void emptyCart(){error(ErrorCode.CART_EMPTY,()->create(PaymentMethod.ONLINE));}
 @Test void insufficientCapacityRollsBack(){line(client,hotel,11,travel());long count=bookings.count();error(ErrorCode.CAPACITY_EXCEEDED,()->create(PaymentMethod.ONLINE));assertEquals(10,capacity());assertEquals(count,bookings.count());assertEquals(1,tx(()->carts.findByClientId(client.getId()).orElseThrow().getItems().size()));}
 @Test void inactiveAfterCart(){line(client,hotel,1,travel());tx(()->{offers.findById(hotel.getId()).orElseThrow().setActive(false);return null;});error(ErrorCode.OFFER_INACTIVE,()->create(PaymentMethod.ONLINE));assertEquals(10,capacity());}
 @Test void outsideAvailability(){line(client,hotel,1,travel().replace("2026-11","2029-11"));error(ErrorCode.AVAILABILITY_NOT_COVERED,()->create(PaymentMethod.ONLINE));}
 @Test void missingCriteria(){line(client,hotel,1,"{}");error(ErrorCode.INVALID_TRAVEL_CRITERIA,()->create(PaymentMethod.ONLINE));}
 @Test void expiredPromoRollsBack(){line(client,hotel,1,travel());promo(DiscountType.FIXED,"50",LocalDate.of(2026,10,31));error(ErrorCode.PROMO_CODE_INVALID,()->create(PaymentMethod.ONLINE));assertEquals(10,capacity());assertNotNull(tx(()->carts.findByClientId(client.getId()).orElseThrow().getPromoCode()));}
 @Test void arrivalRefused(){line(client,hotel,1,travel());tx(()->{offers.findById(hotel.getId()).orElseThrow().setAllowsPayOnArrival(false);return null;});error(ErrorCode.PAY_ON_ARRIVAL_NOT_ALLOWED,()->create(PaymentMethod.PAY_ON_ARRIVAL));}
 @Test void mixedCartAtomicRollback(){line(client,hotel,1,travel());line(client,excursion,11,travel());long count=bookings.count();error(ErrorCode.CAPACITY_EXCEEDED,()->create(PaymentMethod.ONLINE));assertEquals(count,bookings.count());assertEquals(10,capacity());assertEquals(2,tx(()->carts.findByClientId(client.getId()).orElseThrow().getItems().size()));}
 @Test void cumulativeLinesCannotOversell(){line(client,hotel,6,travel());line(client,hotel,5,travel());error(ErrorCode.CAPACITY_EXCEEDED,()->create(PaymentMethod.ONLINE));assertEquals(10,capacity());}
 @Test void cancellationRestoresExactlyOnce(){line(client,hotel,2,travel());var b=create(PaymentMethod.ONLINE);service.cancel(client.getId(),b.id(),new CancelBookingRequest(null));assertEquals(10,capacity());error(ErrorCode.INVALID_BOOKING_STATE,()->service.cancel(client.getId(),b.id(),null));assertEquals(10,capacity());}
 @Test void clientDeadlineAndStaffReason(){
  line(client,hotel,1,travel());var b=create(PaymentMethod.PAY_ON_ARRIVAL);clock.instant=Instant.parse("2026-11-09T12:00:00Z");
  error(ErrorCode.CANCELLATION_DEADLINE_PASSED,()->service.cancel(client.getId(),b.id(),null));
  error(ErrorCode.VALIDATION_ERROR,()->service.cancel(agent.getId(),b.id(),null));
  assertEquals(BookingStatus.CANCELLED,service.cancel(agent.getId(),b.id(),new CancelBookingRequest("Indisponibilité exceptionnelle")).status());assertEquals(10,capacity());
 }
 @Test void exact48HoursAllowed(){line(client,hotel,1,travel());var b=create(PaymentMethod.ONLINE);clock.instant=Instant.parse("2026-11-08T00:00:00Z");assertEquals(BookingStatus.CANCELLED,service.cancel(client.getId(),b.id(),null).status());}
 @Test void paidCancellationAwaitsExplicitAdminRefund(){
  line(client,hotel,1,travel());var b=create(PaymentMethod.ONLINE);PaymentResponse paid=pay(b.id());
  assertEquals(PaymentStatus.PAID,service.cancel(admin.getId(),b.id(),new CancelBookingRequest("Demande client")).paymentStatus());
  paymentService.refund(admin.getId(),paid.id(),UUID.randomUUID().toString(),new PaymentRefundRequest(null,"Demande client"),null);
  assertEquals(PaymentStatus.REFUNDED,service.get(client.getId(),b.id()).paymentStatus());assertEquals(10,capacity());
 }
 @Test void expirationAndIdempotency(){line(client,hotel,1,travel());var b=create(PaymentMethod.ONLINE);assertFalse(service.expire(b.id()));clock.instant=clock.instant.plusSeconds(1801);assertTrue(service.expire(b.id()));assertFalse(service.expire(b.id()));assertEquals(10,capacity());error(ErrorCode.INVALID_BOOKING_STATE,()->service.confirm(agent.getId(),b.id()));}
 @Test void arrivalNeverExpiresAndCompletion(){line(client,hotel,1,travel());var b=create(PaymentMethod.PAY_ON_ARRIVAL);clock.instant=Instant.parse("2026-11-15T00:00:00Z");assertFalse(service.expire(b.id()));assertTrue(service.complete(b.id()));assertFalse(service.complete(b.id()));error(ErrorCode.INVALID_BOOKING_STATE,()->service.cancel(admin.getId(),b.id(),new CancelBookingRequest("Trop tard")));}
 @Test void manualConfirmCannotBypassPayment(){
  line(client,hotel,1,travel());var b=create(PaymentMethod.ONLINE);
  error(ErrorCode.BOOKING_NOT_PAYABLE,()->service.confirm(agent.getId(),b.id()));
  pay(b.id());var confirmed=service.get(client.getId(),b.id());assertEquals(BookingStatus.CONFIRMED,confirmed.status());assertNull(confirmed.expiresAt());assertEquals(PaymentStatus.PAID,confirmed.paymentStatus());
 }
 @Test void ownershipAndSecurity()throws Exception{
  line(client,hotel,1,travel());var b=create(PaymentMethod.PAY_ON_ARRIVAL);
  for(String path:List.of("/api/bookings/"+b.id(),"/api/bookings/"+b.id()+"/voucher"))mvc.perform(get(path).with(user(new AppUserDetails(other)))).andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("BOOKING_NOT_FOUND"));
  mvc.perform(post("/api/bookings/"+b.id()+"/cancel").with(user(new AppUserDetails(other))).contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isNotFound());
  for(String path:List.of("/api/bookings/admin","/api/bookings/supplier"))mvc.perform(get(path).with(user(new AppUserDetails(client)))).andExpect(status().isForbidden());
  mvc.perform(post("/api/bookings/"+b.id()+"/confirm").with(user(new AppUserDetails(client)))).andExpect(status().isForbidden());
  mvc.perform(get("/api/bookings")).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.correlationId").isNotEmpty());
  mvc.perform(get("/api/bookings/"+b.id()).with(user(new AppUserDetails(supplier2)))).andExpect(status().isNotFound());
 }
 @Test void apiCreatesAndPaginates()throws Exception{
  line(client,hotel,1,travel());
  mvc.perform(post("/api/bookings").with(user(new AppUserDetails(client))).contentType(MediaType.APPLICATION_JSON).content("{\"paymentMethod\":\"ONLINE\"}")).andExpect(status().isCreated()).andExpect(jsonPath("$.reference").isNotEmpty());
  mvc.perform(get("/api/bookings?size=1000").with(user(new AppUserDetails(client)))).andExpect(status().isOk()).andExpect(jsonPath("$.size").value(100)).andExpect(jsonPath("$.totalElements").value(1));
  mvc.perform(get("/api/bookings?page=999").with(user(new AppUserDetails(client)))).andExpect(jsonPath("$.content").isEmpty());
  mvc.perform(get("/api/bookings?sort=password,asc").with(user(new AppUserDetails(client)))).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("BAD_REQUEST"));
 }
 @Test void voucherPdfAndState()throws Exception{
  line(client,hotel,1,travel());var b=create(PaymentMethod.ONLINE);
  mvc.perform(get("/api/bookings/"+b.id()+"/voucher").with(user(new AppUserDetails(client)))).andExpect(status().isConflict());
  pay(b.id());
  byte[] pdf=mvc.perform(get("/api/bookings/"+b.id()+"/voucher").with(user(new AppUserDetails(client)))).andExpect(status().isOk()).andExpect(content().contentType("application/pdf")).andReturn().getResponse().getContentAsByteArray();
  assertTrue(pdf.length>1000);assertEquals("%PDF",new String(Arrays.copyOf(pdf,4),java.nio.charset.StandardCharsets.US_ASCII));assertNotEquals(vouchers.token("a"),vouchers.token("b"));
 }
 @Test void yearSequenceRestarts(){line(client,hotel,1,travel());var a=create(PaymentMethod.ONLINE);clock.instant=Instant.parse("2027-01-01T00:00:00Z");line(client,hotel,1,travel().replace("2026-11","2027-11"));var b=create(PaymentMethod.ONLINE);assertEquals("BK-2027-000001",b.reference());assertNotEquals(a.reference(),b.reference());}
 @Test void concurrentCapacityOneExactlyOneSuccess()throws Exception{
  tx(()->{periods.findById(periodId).orElseThrow().setCapacity(1);return null;});
  List<User> competitors=new ArrayList<>();for(int i=0;i<8;i++){User u=tx(()->account(Role.CLIENT));line(u,hotel,1,travel());competitors.add(u);}
  List<Object> results=race(competitors);
  assertEquals(1,results.stream().filter(r->r instanceof BookingResponse).count());assertEquals(7,results.stream().filter(r->r==ErrorCode.CAPACITY_EXCEEDED).count());assertEquals(0,capacity());
 }
 @Test void concurrentReferencesUniqueSequential()throws Exception{
  List<User> competitors=new ArrayList<>();for(int i=0;i<8;i++){User u=tx(()->account(Role.CLIENT));line(u,hotel,1,travel());competitors.add(u);}
  List<BookingResponse> results=race(competitors).stream().map(r->(BookingResponse)r).sorted(Comparator.comparing(BookingResponse::reference)).toList();
  assertEquals(8,results.stream().map(BookingResponse::reference).distinct().count());
  long first=Long.parseLong(results.get(0).reference().substring(8));long last=Long.parseLong(results.get(7).reference().substring(8));assertEquals(7,last-first);assertEquals(2,capacity());
 }
 @Test void flightRoundTripAllocatesBothLegs(){
  Flight f=tx(()->{Flight flight=new Flight();flight.setDepartureDateTime(LocalDateTime.parse("2026-11-10T09:00"));flight.setArrivalDateTime(LocalDateTime.parse("2026-11-10T10:00"));flight.setReturnDepartureDateTime(LocalDateTime.parse("2026-11-12T16:00"));flight.setReturnArrivalDateTime(LocalDateTime.parse("2026-11-12T17:00"));flight.setRoundTrip(true);flight.setCabinClass("BUSINESS");
   offer(flight,supplier,800d,4);flight.setAvailabilities(List.of(new OfferAvailability(LocalDateTime.parse("2026-11-10T07:00"),LocalDateTime.parse("2026-11-10T12:00"),4),new OfferAvailability(LocalDateTime.parse("2026-11-12T14:00"),LocalDateTime.parse("2026-11-12T20:00"),4)));return (Flight)offers.saveAndFlush(flight);});
  line(client,f,1,"{\"startDate\":\"2026-11-10\",\"endDate\":\"2026-11-12\",\"trip\":\"round\",\"cabinClass\":\"BUSINESS\",\"passengers\":2}");
  var b=create(PaymentMethod.ONLINE);tx(()->{assertTrue(offers.findById(f.getId()).orElseThrow().getAvailabilities().stream().allMatch(a->a.getCapacity()==3));return null;});
  service.cancel(client.getId(),b.id(),null);tx(()->{assertTrue(offers.findById(f.getId()).orElseThrow().getAvailabilities().stream().allMatch(a->a.getCapacity()==4));return null;});
 }
 @Test void flightWrongClassRejected(){
  Flight f=tx(()->{Flight flight=new Flight();flight.setDepartureDateTime(LocalDateTime.parse("2026-11-10T09:00"));flight.setArrivalDateTime(LocalDateTime.parse("2026-11-10T10:00"));flight.setCabinClass("BUSINESS");return (Flight)offer(flight,supplier,800d,4);});
  line(client,f,1,travel());error(ErrorCode.INVALID_TRAVEL_CRITERIA,()->create(PaymentMethod.ONLINE));
 }
 Car car(){return tx(()->{Car c=new Car();c.setPickupLocation("Marrakech");c.setMinimumDriverAge(23);c.setMaximumDriverAge(65);c.setAllowsDifferentDropoff(true);c.setDropoffLocations(List.of("Fès","Rabat"));return (Car)offer(c,supplier,400d,3);});}
 @Test void carAgeAndDropoffValidated(){
  Car car=car();line(client,car,1,"{\"pickupDate\":\"2026-11-10\",\"pickupTime\":\"10:00\",\"returnDate\":\"2026-11-12\",\"returnTime\":\"12:00\",\"driverAge\":35,\"pickup\":\"Marrakech\",\"dropoff\":\"Rabat\"}");
  var b=create(PaymentMethod.ONLINE);assertEquals(LocalDateTime.parse("2026-11-12T12:00"),b.serviceEndAt());assertEquals(new BigDecimal("400.00"),b.total());
 }
 @Test void carUnauthorizedDropoffRollsBack(){Car c=car();line(client,c,1,"{\"startDate\":\"2026-11-10\",\"endDate\":\"2026-11-12\",\"driverAge\":35,\"pickup\":\"Marrakech\",\"dropoff\":\"Paris\"}");error(ErrorCode.INVALID_TRAVEL_CRITERIA,()->create(PaymentMethod.ONLINE));}
 @Test void carTooYoungRejected(){Car c=car();line(client,c,1,"{\"startDate\":\"2026-11-10\",\"endDate\":\"2026-11-12\",\"driverAge\":18,\"pickup\":\"Marrakech\"}");error(ErrorCode.INVALID_TRAVEL_CRITERIA,()->create(PaymentMethod.ONLINE));}
 @Test void supplierListContainsOnlyOwnReservationsAndTotals(){
  line(client,hotel,1,travel());line(client,excursion,1,travel());var b=create(PaymentMethod.ONLINE);
  var filter=new BookingService.Filters(null,null,null,null,null,null,null,null);
  var page=service.list(supplier.getId(),"supplier",filter,0,20,null);
  var own=page.getContent().stream().filter(r->r.id().equals(b.id())).findFirst().orElseThrow();assertEquals(new BigDecimal("1000.00"),own.total());assertNull(own.clientEmail());
  var otherPage=service.list(other.getId(),"client",filter,0,20,null);assertEquals(0,otherPage.getTotalElements());
 }
 @Test void supplierCannotModifyAndHasNoVoucher()throws Exception{
  line(client,hotel,1,travel());var b=create(PaymentMethod.PAY_ON_ARRIVAL);
  mvc.perform(post("/api/bookings/"+b.id()+"/cancel").with(user(new AppUserDetails(supplier))).contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Refus\"}")).andExpect(status().isForbidden());
  mvc.perform(get("/api/bookings/"+b.id()+"/voucher").with(user(new AppUserDetails(supplier)))).andExpect(status().isForbidden());
 }
 @Test void demoSeederIsIdempotentAndHistorical(){
  tx(()->{
   users.save(new User("Sarah","sarah.benali@example.com","hash",Role.CLIENT));users.save(new User("Nadia","nadia.elfassi@atlasvoyage.ma","hash",Role.AGENT));users.save(new User("Omar","omar.tazi@atlasvoyage.ma","hash",Role.ADMIN));
   offers.findById(hotel.getId()).orElseThrow().setTitle("Riad Atlas Prestige");return null;
  });
  var seeder=new DemoBookingSeeder(bookings,users,offers,carts,service,mapper,clock,paymentService,paymentRepository,tm);
  seeder.run();
  long count=bookings.count();int remaining=capacity();
  seeder.run();
  assertEquals(count,bookings.count());assertEquals(remaining,capacity());
  var partial=bookings.findAll((r,q,cb)->cb.equal(r.get("notes"),"demo:payment:phase3:partial"),org.springframework.data.domain.PageRequest.of(0,1)).getContent().get(0);
  assertEquals(BookingStatus.CONFIRMED,partial.getStatus());assertEquals(PaymentStatus.PARTIALLY_REFUNDED,partial.getPaymentStatus());
 }
 List<Object> race(List<User> clients)throws Exception{
  CountDownLatch ready=new CountDownLatch(clients.size()),start=new CountDownLatch(1);ExecutorService pool=Executors.newFixedThreadPool(clients.size());
  try{
   List<Future<Object>> tasks=new ArrayList<>();
   for(User u:clients)tasks.add(pool.submit(()->{ready.countDown();start.await();try{return service.createFromCart(u.getId(),new CreateBookingRequest(PaymentMethod.ONLINE,null,null));}catch(BusinessException e){return e.getCode();}}));
   assertTrue(ready.await(10,TimeUnit.SECONDS));start.countDown();List<Object> results=new ArrayList<>();for(Future<Object> f:tasks)results.add(f.get(30,TimeUnit.SECONDS));return results;
  }finally{pool.shutdownNow();}
 }
}

