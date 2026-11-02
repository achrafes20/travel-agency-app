package com.agence.voyage.stats;
import com.agence.voyage.config.*;
import com.agence.voyage.dto.*;
import com.agence.voyage.dto.stats.StatsDtos.*;
import com.agence.voyage.entity.*;
import com.agence.voyage.entity.Role;
import com.agence.voyage.event.*;
import com.agence.voyage.repository.*;
import com.agence.voyage.service.*;
import com.agence.voyage.security.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.*;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.cache.CacheManager;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.time.*;
import java.math.BigDecimal;
import java.util.*;
import java.io.*;
import java.util.function.Supplier;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties="spring.datasource.url=jdbc:h2:mem:phase5_stats_${random.uuid};MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
@AutoConfigureMockMvc @ActiveProfiles("test") @Import(StatsIntegrationTest.TimeConfig.class)
class StatsIntegrationTest {
 @TestConfiguration static class TimeConfig{@Bean @Primary Clock statsClock(){return Clock.fixed(Instant.parse("2026-10-31T12:00:00Z"),ZoneOffset.UTC);}}
 @Autowired StatsService stats;@Autowired StatsRepository repository;@Autowired StatsCsvService csv;
 @Autowired UserRepository users;@Autowired CityRepository cities;@Autowired OfferRepository offers;
 @Autowired BookingRepository bookings;@Autowired PaymentRepository payments;@Autowired NotificationRepository notifications;
 @Autowired BookingAllocationRepository allocations;@Autowired BookingService bookingService;@Autowired CartRepository carts;
 @Autowired CacheManager cache;@Autowired Clock clock;@Autowired JdbcTemplate jdbc;@Autowired MockMvc mvc;@Autowired JwtService jwt;
 @Autowired PlatformTransactionManager manager;@Autowired ApplicationEventPublisher publisher;
 @Autowired com.agence.voyage.config.AppProperties properties;
 @Autowired org.springframework.security.crypto.password.PasswordEncoder passwords;
 @Autowired PaymentEventRepository paymentEvents;@Autowired PromoCodeRepository promos;@Autowired AuditService audit;
 @SpyBean StatsAdminCalculator calculator;
 User admin,agent,supplier,otherSupplier,client,otherClient;Hotel hotel,otherHotel;City city,otherCity;
 <T>T tx(Supplier<T> work){return new TransactionTemplate(manager).execute(s->work.get());}
 BigDecimal amount(String value){return new BigDecimal(value);}
 User account(Role role){User u=new User(role.name(),"stats-"+UUID.randomUUID()+"@test.ma","hash",role);u.setCreatedAt(LocalDateTime.parse("2026-01-01T00:00"));return users.save(u);}
 @BeforeEach void setup(){
  cache.getCache("adminStats").clear();
  // Base H2 dédiée à cette classe : jamais la base de développement.
  jdbc.execute("SET REFERENTIAL_INTEGRITY FALSE");
  for(String table:jdbc.queryForList("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'",String.class))jdbc.execute("TRUNCATE TABLE "+table);
  jdbc.execute("SET REFERENTIAL_INTEGRITY TRUE");
  tx(()->{admin=account(Role.ADMIN);agent=account(Role.AGENT);supplier=account(Role.SUPPLIER);otherSupplier=account(Role.SUPPLIER);client=account(Role.CLIENT);otherClient=account(Role.CLIENT);
   city=cities.save(new City("Marrakech",1d,2d));otherCity=cities.save(new City("Fès",3d,4d));
   hotel=hotel(supplier,city,"Riad A",100d);otherHotel=hotel(otherSupplier,otherCity,"Riad B",200d);return null;});
  clearInvocations(calculator);
 }
 Hotel hotel(User supplier,City city,String title,double price){
  Hotel h=new Hotel();h.setTitle(title);h.setCity(city);h.setSupplier(supplier);h.setBasePrice(price);h.setActive(true);h.setAllowsPayOnArrival(true);
  h.setAvailabilities(List.of(new OfferAvailability(LocalDateTime.parse("2026-10-01T00:00"),LocalDateTime.parse("2026-12-31T23:59"),20)));
  return offers.saveAndFlush(h);
 }
 Booking booking(User owner,BookingStatus status,String created,BigDecimal total,Hotel...services){
  return tx(()->{
   Booking b=new Booking();b.setClient(owner);b.setReference("ST-"+UUID.randomUUID().toString().substring(0,20));b.setStatus(status);
   b.setPaymentMethod(PaymentMethod.ONLINE);b.setSubtotal(total);b.setDiscount(amount("0.00"));b.setTotal(total);b.setCreatedAt(LocalDateTime.parse(created));
   b.setServiceStartAt(LocalDateTime.parse("2026-11-10T12:00"));b.setServiceEndAt(LocalDateTime.parse("2026-11-12T12:00"));
   b.setPaymentStatus(status==BookingStatus.CONFIRMED||status==BookingStatus.COMPLETED?PaymentStatus.PAID:PaymentStatus.PENDING);
   BigDecimal unit=total.divide(BigDecimal.valueOf(services.length),2,java.math.RoundingMode.HALF_UP);
   for(Hotel offer:services){BookingItem i=new BookingItem();i.setBooking(b);i.setOffer(offer);i.setSupplier(offer.getSupplier());i.setTitleSnapshot(offer.getTitle());i.setQuantity(1);
    i.setUnitPrice(unit);i.setLineTotal(unit);i.setServiceStartAt(b.getServiceStartAt());i.setServiceEndAt(b.getServiceEndAt());b.getItems().add(i);}
   return bookings.saveAndFlush(b);
  });
 }
 void payment(Booking b,PaymentStatus status,String value,String refund){
  tx(()->{Payment p=new Payment();p.setBooking(b);p.setClient(b.getClient());p.setMethod(PaymentMethod.CARD);p.setStatus(status);p.setAmount(amount(value));p.setRefundedAmount(amount(refund));
   p.setCreatedAt(b.getCreatedAt());p.setUpdatedAt(b.getCreatedAt());p.setPaidAt(b.getCreatedAt());payments.saveAndFlush(p);return null;});
 }
 @Test void emptyDomainsReturnZeros(){
  var a=stats.admin(admin.getId(),"30d");assertEquals(0,a.bookings().total().value().signum());assertEquals(0,a.revenue().total().value().signum());
  assertEquals(30,a.revenue().series().size());assertTrue(a.topDestinations().isEmpty());assertNull(a.revenue().total().changePercent());
  assertFalse(stats.agent(agent.getId(),"30d").tickets().available());assertNull(stats.client(client.getId(),"30d").nextTrip());
 }
 @Test void earnedOnlyConfirmedCompletedAndPendingSeparate(){
  booking(client,BookingStatus.CONFIRMED,"2026-10-29T12:00",amount("1000"),hotel);
  booking(client,BookingStatus.COMPLETED,"2026-10-28T12:00",amount("500"),hotel);
  booking(client,BookingStatus.PENDING,"2026-10-27T12:00",amount("300"),hotel);
  booking(client,BookingStatus.CANCELLED,"2026-10-27T13:00",amount("800"),hotel);
  booking(client,BookingStatus.EXPIRED,"2026-10-27T14:00",amount("900"),hotel);
  var a=stats.admin(admin.getId(),"30d");
  assertEquals(amount("1500.00"),a.revenue().total().value());assertEquals(amount("300.00"),a.revenue().pendingRevenue().value());
  assertEquals(amount("750.00"),a.revenue().averageOrder().value());assertEquals(5,a.bookings().total().value().longValueExact());
 }
 @Test void mutationChangesKpisSeriesAndTops(){
  Booking b=booking(client,BookingStatus.PENDING,"2026-10-29T12:00",amount("1000"),hotel);
  var before=stats.admin(admin.getId(),"30d");assertTrue(before.topOffers().isEmpty());assertEquals(amount("1000.00"),before.revenue().pendingRevenue().value());
  tx(()->{bookings.findById(b.getId()).orElseThrow().setStatus(BookingStatus.CONFIRMED);return null;});cache.getCache("adminStats").clear();
  var confirmed=stats.admin(admin.getId(),"30d");assertEquals(amount("1000.00"),confirmed.revenue().total().value());assertEquals(1,confirmed.topOffers().size());
  assertEquals(amount("1000.00"),confirmed.revenue().series().stream().map(Point::revenue).reduce(amount("0.00"),BigDecimal::add));
  tx(()->{var current=bookings.findById(b.getId()).orElseThrow();current.setTotal(amount("1200"));current.setSubtotal(amount("1200"));current.getItems().getFirst().setUnitPrice(amount("1200"));current.getItems().getFirst().setLineTotal(amount("1200"));return null;});cache.getCache("adminStats").clear();
  assertEquals(amount("1200.00"),stats.admin(admin.getId(),"30d").revenue().total().value());
  tx(()->{bookings.findById(b.getId()).orElseThrow().setStatus(BookingStatus.CANCELLED);return null;});cache.getCache("adminStats").clear();
  var cancelled=stats.admin(admin.getId(),"30d");assertEquals(0,cancelled.revenue().total().value().signum());assertTrue(cancelled.topDestinations().isEmpty());
 }
 @Test void supplierIsolationAndMixedLines(){
  var b=booking(client,BookingStatus.CONFIRMED,"2026-10-29T12:00",amount("1000"),hotel,otherHotel);
  tx(()->{var current=bookings.findById(b.getId()).orElseThrow();var first=current.getItems().getFirst();first.setQuantity(2);first.setUnitPrice(amount("200"));first.setLineTotal(amount("400"));
   var second=current.getItems().getLast();second.setUnitPrice(amount("600"));second.setLineTotal(amount("600"));return null;});
  booking(otherClient,BookingStatus.CONFIRMED,"2026-10-30T12:00",amount("3000"),otherHotel);
  var mine=stats.supplier(supplier.getId(),"30d");var theirs=stats.supplier(otherSupplier.getId(),"30d");
  assertEquals(amount("400.00"),mine.revenue().value());assertEquals(amount("3600.00"),theirs.revenue().value());assertEquals(1,mine.bookings().value().longValue());
  assertEquals(amount("400.00"),mine.recentBookings().getFirst().total());assertEquals(1,mine.offers().total());
 }
 @Test void clientIsolationAndSpentNetOfRefund(){
  Booking b=booking(client,BookingStatus.CONFIRMED,"2026-10-29T12:00",amount("1000"),hotel);payment(b,PaymentStatus.PARTIALLY_REFUNDED,"1000","250");
  Booking other=booking(otherClient,BookingStatus.CONFIRMED,"2026-10-29T12:00",amount("9000"),otherHotel);payment(other,PaymentStatus.PAID,"9000","0");
  var mine=stats.client(client.getId(),"30d");assertEquals(1,mine.totals().bookings());assertEquals(amount("750.00"),mine.totals().spent());
  assertEquals(b.getId(),mine.nextTrip().id());assertEquals(1,mine.recentBookings().size());
 }
 @Test void previousPeriodAndPercentages(){
  booking(client,BookingStatus.CONFIRMED,"2026-09-20T12:00",amount("500"),hotel);
  booking(client,BookingStatus.CONFIRMED,"2026-10-29T12:00",amount("1000"),hotel);
  var a=stats.admin(admin.getId(),"30d");assertEquals(amount("500.00"),a.revenue().total().previous());assertEquals(amount("100.00"),a.revenue().total().changePercent());
 }
 @Test void allPeriodsCompleteWithoutHoles(){
  for(String code:List.of("7d","30d","12m")){
   var a=stats.admin(admin.getId(),code);assertEquals(code.equals("7d")?7:code.equals("30d")?30:12,a.bookings().series().size());
   assertTrue(a.revenue().series().stream().allMatch(p->p.revenue().signum()==0));assertEquals("Africa/Casablanca",a.timezone());assertEquals("MAD",a.currency());
  }
  assertEquals(6,stats.supplier(supplier.getId(),"7d").revenueSixMonths().size());
 }
 @Test void casablancaBoundaryAndRamadan(){
  var p=StatsPeriod.resolve("7d",clock);
  booking(client,BookingStatus.CONFIRMED,p.startUtc().minusNanos(1000).toString(),amount("20"),hotel);
  booking(client,BookingStatus.CONFIRMED,p.startUtc().toString(),amount("30"),hotel);
  assertEquals(amount("30.00"),stats.admin(admin.getId(),"7d").revenue().total().value());
  Clock ramadan=Clock.fixed(Instant.parse("2026-03-10T12:00:00Z"),ZoneOffset.UTC);
  var march=StatsPeriod.resolve("7d",ramadan);assertEquals(march.from().atStartOfDay(StatsPeriod.ZONE).toInstant(),march.startUtc().toInstant(ZoneOffset.UTC));
 }
 @Test void invalidPeriodReturnsBadRequest()throws Exception{
  for(String role:List.of("admin","supplier","agent","client")){
   User u=switch(role){case "admin"->admin;case "supplier"->supplier;case "agent"->agent;default->client;};
   mvc.perform(get("/api/stats/"+role+"?period=all").with(user(new AppUserDetails(u)))).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("BAD_REQUEST"));
  }
 }
 @Test void endpointSecurityMatrix()throws Exception{
  for(String path:List.of("/api/stats/admin","/api/stats/supplier","/api/stats/agent","/api/stats/client","/api/stats/admin/export/bookings.csv","/api/stats/admin/export/revenue.csv")){
   mvc.perform(get(path)).andExpect(status().isUnauthorized()).andExpect(header().string("Cache-Control","no-store"));
   for(User actor:List.of(admin,agent,supplier,client)){
    boolean allowed=path.contains("/admin")?actor==admin:path.endsWith("supplier")?actor==supplier:path.endsWith("client")?actor==client:actor==agent||actor==admin;
    var result=mvc.perform(get(path).with(user(new AppUserDetails(actor))));
    if(allowed)result.andExpect(status().isOk());else result.andExpect(status().isForbidden());
   }
  }
 }
 @Test void spoofedSupplierAndClientIdsIgnored()throws Exception{
  booking(otherClient,BookingStatus.CONFIRMED,"2026-10-29T12:00",amount("999"),otherHotel);
  mvc.perform(get("/api/stats/supplier?supplierId="+otherSupplier.getId()).with(user(new AppUserDetails(supplier)))).andExpect(jsonPath("$.revenue.value").value(0.0));
  mvc.perform(get("/api/stats/client?clientId="+otherClient.getId()).with(user(new AppUserDetails(client)))).andExpect(jsonPath("$.totals.bookings").value(0));
 }
 @Test void archivedJwtRefused()throws Exception{
  String token=jwt.generateToken(client);tx(()->{users.findById(client.getId()).orElseThrow().setArchived(true);return null;});
  mvc.perform(get("/api/stats/client").header("Authorization","Bearer "+token)).andExpect(status().isUnauthorized());
 }
 @Test void cacheComputesOnceAndNeverBypassesAuthorization(){
  stats.admin(admin.getId(),"30d");stats.admin(admin.getId(),"30d");verify(calculator,times(1)).calculate("30d");
  assertThrows(com.agence.voyage.exception.ForbiddenException.class,()->stats.admin(supplier.getId(),"30d"));
  stats.admin(admin.getId(),"7d");verify(calculator,times(1)).calculate("7d");
 }
 @Test void afterCommitInvalidatesAdminCache(){
  stats.admin(admin.getId(),"30d");tx(()->{publisher.publishEvent(new BookingCreatedEvent("test-cache",new BookingNotice(1L,client.getId(),"BK-2026-000001",amount("100"),LocalDateTime.now(clock),LocalDateTime.now(clock).plusDays(1),List.of())));return null;});
  stats.admin(admin.getId(),"30d");verify(calculator,times(2)).calculate("30d");
 }
 @Test void estimatedUserDatesNotCalledNewSignups(){
  tx(()->{User u=users.findById(client.getId()).orElseThrow();u.setCreatedAt(LocalDateTime.now(clock));u.setCreatedAtEstimated(true);return null;});
  var a=stats.admin(admin.getId(),"30d");assertEquals(1,a.users().estimatedCreationDates());assertEquals(0,a.users().newUsers().value().signum());assertNull(a.users().total().previous());
 }
 @Test void availabilityChecksAndOfferCounts(){
  tx(()->{var h=offers.findById(hotel.getId()).orElseThrow();h.getAvailabilities().getFirst().setCapacity(1);return null;});
  var a=stats.supplier(supplier.getId(),"30d");assertEquals(1,a.availabilityChecks().count());assertTrue(a.availabilityChecks().items().getFirst().lowCapacity());
  assertEquals(0,stats.supplier(otherSupplier.getId(),"30d").availabilityChecks().count());
 }
 @Test void offersWithoutFutureAndEndingSoon(){
  tx(()->{var h=offers.findById(hotel.getId()).orElseThrow();h.getAvailabilities().getFirst().setEndAt(LocalDateTime.now(clock).plusDays(2));return null;});
  assertTrue(stats.supplier(supplier.getId(),"30d").availabilityChecks().items().getFirst().endingSoon());
  tx(()->{offers.findById(hotel.getId()).orElseThrow().getAvailabilities().clear();return null;});
  assertTrue(stats.supplier(supplier.getId(),"30d").availabilityChecks().items().getFirst().noFuturePeriod());
  assertTrue(stats.admin(admin.getId(),"30d").alerts().stream().anyMatch(a->a.code().equals("NO_AVAILABILITY")));
 }
 @Test void pendingCashAndAgentToday(){
  Booking b=booking(client,BookingStatus.CONFIRMED,"2026-10-31T10:00",amount("900"),hotel);
  tx(()->{b.setPaymentMethod(PaymentMethod.PAY_ON_ARRIVAL);b.setPaymentStatus(PaymentStatus.PENDING);bookings.save(b);
   Payment p=new Payment();p.setBooking(b);p.setClient(client);p.setAmount(amount("900"));p.setMethod(PaymentMethod.CASH_ON_ARRIVAL);p.setCreatedAt(b.getCreatedAt());p.setUpdatedAt(b.getCreatedAt());payments.save(p);return null;});
  var a=stats.agent(agent.getId(),"7d");assertEquals(1,a.cashPendingCount());assertEquals(amount("900.00"),a.cashPendingAmount());assertEquals(1,a.bookingsToday().value().longValue());assertEquals(1,a.upcomingPayments().size());
 }
 @Test void notificationsOnlyOwnerAndUnread(){
  tx(()->{for(User owner:List.of(client,otherClient)){Notification n=new Notification();n.setUser(owner);n.setTitle("Info");n.setMessage("Privé");n.setCreatedAt(LocalDateTime.now(clock));notifications.save(n);}return null;});
  var a=stats.client(client.getId(),"30d");assertEquals(1,a.notifications().count());assertEquals(1,a.notifications().items().size());
 }
 @Test void topDestinationCountsDistinctBookings(){
  booking(client,BookingStatus.CONFIRMED,"2026-10-29T12:00",amount("1000"),hotel,otherHotel);
  var a=stats.admin(admin.getId(),"30d");assertEquals(2,a.topDestinations().size());assertEquals(1,a.topDestinations().getFirst().bookings());
  assertEquals(amount("1000.00"),a.topDestinations().stream().map(Destination::revenue).reduce(amount("0.00"),BigDecimal::add));
 }
 @Test void globalDiscountAllocatedToTops(){
  var b=booking(client,BookingStatus.CONFIRMED,"2026-10-29T12:00",amount("1000"),hotel,otherHotel);
  tx(()->{var x=bookings.findById(b.getId()).orElseThrow();x.setDiscount(amount("100"));x.setTotal(amount("900"));return null;});
  var a=stats.admin(admin.getId(),"30d");assertEquals(amount("900.00"),a.revenue().total().value());assertEquals(amount("900.00"),a.topOffers().stream().map(TopOffer::revenue).reduce(amount("0.00"),BigDecimal::add));
 }
 @Test void revenueCsvBomAndSeries()throws Exception{
  var out=new ByteArrayOutputStream();csv.revenue(out,StatsPeriod.resolve("7d",clock));
  String value=out.toString(java.nio.charset.StandardCharsets.UTF_8);assertTrue(value.startsWith("\uFEFF"));assertTrue(value.contains("Chiffre d'affaires TTC"));assertEquals(8,value.split("\r\n").length);assertTrue(value.contains("\"0.00\""));
 }
 @Test void bookingsCsvEscapesAndNeutralizesFormulas()throws Exception{
  tx(()->{var u=users.findById(client.getId()).orElseThrow();u.setFullName("=SUM(1;2)");var h=offers.findById(hotel.getId()).orElseThrow();h.setTitle("+Texte ; \"cité\"");return null;});
  Hotel current=(Hotel)offers.findById(hotel.getId()).orElseThrow();booking(client,BookingStatus.CONFIRMED,"2026-10-29T12:00",amount("1000"),current);
  var out=new ByteArrayOutputStream();csv.bookings(out,csv.selection(LocalDate.parse("2026-10-01"),LocalDate.parse("2026-10-31"),null,"30d"));
  String value=out.toString(java.nio.charset.StandardCharsets.UTF_8);assertTrue(value.startsWith("\uFEFF"));assertTrue(value.contains("\"'=SUM(1;2)\""));assertTrue(value.contains("\"'+Texte ; \"\"cité\"\"\""));assertTrue(value.contains("\"1000.00\""));
  for(String dangerous:List.of("=1","+1","-1","@X","\tX","\rX","  =X"))assertTrue(StatsCsvService.cell(dangerous,true).startsWith("\"'"));
 }
 @Test void csvFiltersValidationAndHttpDownload()throws Exception{
  booking(client,BookingStatus.CONFIRMED,"2026-10-29T12:00",amount("1000"),hotel);
  mvc.perform(get("/api/stats/admin/export/bookings.csv?from=2023-01-01&to=2026-10-31").with(user(new AppUserDetails(admin)))).andExpect(status().isBadRequest());
  mvc.perform(get("/api/stats/admin/export/bookings.csv?status=REJECTED").with(user(new AppUserDetails(admin)))).andExpect(status().isBadRequest());
  var result=mvc.perform(get("/api/stats/admin/export/bookings.csv?status=CANCELLED").with(user(new AppUserDetails(admin)))).andExpect(request().asyncStarted()).andReturn();
  mvc.perform(asyncDispatch(result)).andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store")).andExpect(header().exists("Content-Disposition"))
   .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("ST-"))));
  // Le flux JWT réel doit finir sans seconde autorisation anonyme au dispatch ASYNC.
  var jwtResult=mvc.perform(get("/api/stats/admin/export/revenue.csv").header("Authorization","Bearer "+jwt.generateToken(admin)))
   .andExpect(request().asyncStarted()).andReturn();
  mvc.perform(asyncDispatch(jwtResult)).andExpect(status().isOk()).andExpect(content().string(org.hamcrest.Matchers.startsWith("\uFEFF")));
 }
 @Test void demoHistoryIsIdempotentFinanciallyCoherentAndNeverOverlaps(){
  tx(()->{users.findById(client.getId()).orElseThrow().setEmail("sarah.benali@example.com");users.findById(agent.getId()).orElseThrow().setEmail("nadia.elfassi@atlasvoyage.ma");return null;});
  var seed=new com.agence.voyage.config.StatsDemoSeeder(users,offers,bookings,payments,promos,paymentEvents,audit,passwords,properties,clock);
  tx(()->{seed.run();return null;});
  assertEquals(60,bookings.count());assertEquals(60,payments.count());assertEquals(60,allocations.count());
  var capacity=jdbc.queryForList("SELECT id,capacity FROM offer_availabilities ORDER BY id");
  tx(()->{seed.run();return null;});
  assertEquals(60,bookings.count());assertEquals(capacity,jdbc.queryForList("SELECT id,capacity FROM offer_availabilities ORDER BY id"));
  assertEquals(12,jdbc.queryForObject("SELECT COUNT(DISTINCT SUBSTRING(reference,12,6)) FROM bookings WHERE reference LIKE 'DEMO-STATS-%'",Long.class));
  assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM bookings b JOIN payments p ON p.booking_id=b.id WHERE b.total<>p.amount OR b.total<>b.subtotal-b.discount",Long.class));
  assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM booking_allocations a JOIN booking_items i ON i.id=a.booking_item_id JOIN bookings b ON b.id=i.booking_id WHERE a.restored<>(b.status IN ('CANCELLED','EXPIRED'))",Long.class));
  assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM offer_availabilities a JOIN offer_availabilities b ON a.offer_id=b.offer_id AND a.id<b.id AND a.available_from<b.available_until AND b.available_from<a.available_until",Long.class));
  assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM booking_allocations x JOIN offer_availabilities a ON a.id=x.availability_id JOIN booking_items i ON i.id=x.booking_item_id WHERE i.service_start_at<a.available_from OR i.service_end_at>a.available_until",Long.class));
  assertTrue(jdbc.queryForObject("SELECT MIN(capacity) FROM offer_availabilities",Integer.class)>=0);
  assertTrue(stats.admin(admin.getId(),"12m").revenue().series().stream().allMatch(p->p.revenue().signum()>0));
 }
 @Test void promoAlertsUseRealExpirationUsageAndArchivedHistory(){
  tx(()->{
   PromoCode p=new PromoCode();p.setCode("HOT10");p.setDiscountType(DiscountType.PERCENTAGE);p.setValue(amount("10"));p.setActive(true);p.setExpiryDate(LocalDate.parse("2027-01-01"));promos.saveAndFlush(p);
   for(int i=0;i<10;i++){Booking b=booking(client,BookingStatus.CONFIRMED,"2026-10-29T12:00",amount("100"),hotel);b.setPromoCode(p);bookings.save(b);}
   PromoCode soon=new PromoCode();soon.setCode("SOON");soon.setDiscountType(DiscountType.FIXED);soon.setValue(amount("5"));soon.setActive(true);soon.setExpiryDate(LocalDate.parse("2026-11-05"));promos.save(soon);
   return null;
  });
  var watch=stats.admin(admin.getId(),"30d").promoCodes();assertTrue(watch.stream().anyMatch(p->p.code().equals("HOT10")&&p.reason().equals("HEAVY_USAGE")&&p.uses()==10));
  assertTrue(watch.stream().anyMatch(p->p.code().equals("SOON")&&p.reason().equals("EXPIRING")));
  tx(()->{promos.findByCodeIgnoreCase("HOT10").orElseThrow().setActive(false);return null;});cache.getCache("adminStats").clear();
  assertTrue(stats.admin(admin.getId(),"30d").promoCodes().stream().anyMatch(p->p.code().equals("HOT10")&&p.reason().equals("INACTIVE_USED")));
 }
}
