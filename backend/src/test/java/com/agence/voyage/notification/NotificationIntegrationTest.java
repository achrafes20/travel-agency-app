package com.agence.voyage.notification;

import com.agence.voyage.config.*;
import com.agence.voyage.dto.*;
import com.agence.voyage.entity.*;
import com.agence.voyage.entity.Role;
import com.agence.voyage.event.*;
import com.agence.voyage.exception.*;
import com.agence.voyage.repository.*;
import com.agence.voyage.security.AppUserDetails;
import com.agence.voyage.service.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.*;
import org.springframework.boot.test.context.*;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.*;
import org.springframework.context.*;
import org.springframework.context.annotation.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.*;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.thymeleaf.spring6.SpringTemplateEngine;
import jakarta.mail.*;
import jakarta.mail.internet.MimeMessage;
import java.time.*;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
import java.util.function.Supplier;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:phase4_notifications_${random.uuid};MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE","app.mail.enabled=true"})
@AutoConfigureMockMvc @ActiveProfiles("test") @Import(NotificationIntegrationTest.TimeConfig.class)
class NotificationIntegrationTest {
 @TestConfiguration static class TimeConfig {
  @Bean @Primary Clock notificationClock(){return Clock.fixed(Instant.parse("2026-11-01T12:00:00Z"),ZoneOffset.UTC);}
 }
 @Autowired UserRepository users;@Autowired NotificationRepository repository;
 @Autowired NotificationPreferenceRepository preferences;@Autowired NotificationDispatchRepository dispatches;
 @Autowired ApplicationEventPublisher publisher;@Autowired PlatformTransactionManager manager;
 @Autowired MockMvc mvc;@Autowired Clock clock;@Autowired AuthService auth;
 @Autowired OfferService offersService;@Autowired OfferRepository offers;@Autowired CityRepository cities;
 @Autowired AvailabilityAlertService alerts;@Autowired NotificationDemoSeeder seeder;
 @Autowired EmailService emails;@Autowired SpringTemplateEngine templates;
 @Autowired @Qualifier("notificationMailExecutor") ThreadPoolTaskExecutor executor;
 @MockBean JavaMailSender sender;
 @SpyBean NotificationService notifications;
 User client,other,supplier,otherSupplier,agent,admin,archived;
 final List<MimeMessage> mails=Collections.synchronizedList(new ArrayList<>());
 <T>T tx(Supplier<T> work){return new TransactionTemplate(manager).execute(s->work.get());}
 void emit(Object event){tx(()->{publisher.publishEvent(event);return null;});drain();}
 void drain(){
  long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(8);
  while(executor.getActiveCount()>0||!executor.getThreadPoolExecutor().getQueue().isEmpty()){
   if(System.nanoTime()>deadline)fail("La file e-mail ne se termine pas");
   try{Thread.sleep(10);}catch(InterruptedException ex){Thread.currentThread().interrupt();fail(ex);}
  }
 }
 User account(Role role){return users.save(new User(role.name(),"notify-"+UUID.randomUUID()+"@test.ma","hash",role));}
 @BeforeEach void setup(){
  drain();reset(sender,notifications);mails.clear();
  when(sender.createMimeMessage()).thenAnswer(i->new MimeMessage(Session.getInstance(new Properties())));
  doAnswer(i->{mails.add(i.getArgument(0));return null;}).when(sender).send(any(MimeMessage.class));
  tx(()->{
   users.findAll().forEach(u->u.setArchived(true));users.flush();
   client=account(Role.CLIENT);other=account(Role.CLIENT);supplier=account(Role.SUPPLIER);
   otherSupplier=account(Role.SUPPLIER);agent=account(Role.AGENT);admin=account(Role.ADMIN);
   archived=account(Role.SUPPLIER);archived.setArchived(true);users.saveAndFlush(archived);return null;
  });
 }
 @AfterEach void after(){drain();}
 BookingNotice notice(){
  return new BookingNotice(123L,client.getId(),"BK-2026-000123",new BigDecimal("1500.00"),
   LocalDateTime.parse("2026-11-10T12:00"),LocalDateTime.parse("2026-11-12T12:00"),
   List.of(new BookingNotice.Line(supplier.getId(),"Hôtel privé A",1,new BigDecimal("1000.00"),LocalDateTime.parse("2026-11-10T12:00"),LocalDateTime.parse("2026-11-12T12:00")),
    new BookingNotice.Line(otherSupplier.getId(),"Excursion privée B",1,new BigDecimal("500.00"),LocalDateTime.parse("2026-11-11T12:00"),LocalDateTime.parse("2026-11-11T14:00"))));
 }
 List<NotificationResponse> rows(User u){return notifications.list(u.getId(),null,null,null,0,50).getContent();}
 NotificationResponse direct(User u,String key){return notifications.notify(u.getId(),NotificationType.SYSTEM,"Information","Message","/frontend/client/index.html?page=notifications","SYSTEM",1L,key);}
 @Test void createdRecipientsAndSupplierPrivacy(){
  emit(new BookingCreatedEvent("created-1",notice()));
  for(User u:List.of(client,supplier,otherSupplier,agent))assertEquals(1,rows(u).size());
  for(User u:List.of(other,admin,archived))assertTrue(rows(u).isEmpty());
  assertTrue(rows(supplier).getFirst().message().contains("Hôtel privé A"));
  assertFalse(rows(supplier).getFirst().message().contains("Excursion privée B"));
  assertFalse(rows(supplier).getFirst().message().contains("1500"));
 }
 @Test void confirmedRecipients(){
  emit(new BookingConfirmedEvent("confirmed-1",notice()));
  for(User u:List.of(client,supplier,otherSupplier))assertEquals(1,rows(u).size());
  for(User u:List.of(other,agent,admin,archived))assertTrue(rows(u).isEmpty());
 }
 @Test void cancellationRecipientsAndAuthor(){
  emit(new BookingCancelledEvent("cancel-1",notice(),"Demande client","Nadia"));
  for(User u:List.of(client,supplier,otherSupplier,agent))assertTrue(rows(u).getFirst().message().contains("Nadia"));
  assertTrue(rows(other).isEmpty());assertTrue(rows(admin).isEmpty());
 }
 @Test void receivedRecipients(){
  emit(new PaymentReceivedEvent("received-1",22L,notice(),new BigDecimal("1500"),"CARD",LocalDateTime.now(clock)));
  for(User u:List.of(client,supplier,otherSupplier))assertEquals(NotificationType.PAYMENT_RECEIVED,rows(u).getFirst().type());
  assertTrue(rows(agent).isEmpty());assertTrue(rows(other).isEmpty());
 }
 @Test void failedOnlyClient(){
  emit(new PaymentFailedEvent("failed-1",22L,notice(),"Carte refusée"));
  assertEquals(1,rows(client).size());
  for(User u:List.of(supplier,otherSupplier,agent,admin,other))assertTrue(rows(u).isEmpty());
 }
 @Test void availabilityRecipients(){
  emit(new AvailabilityLowEvent("low-1",1L,2L,supplier.getId(),"Hôtel",1,10));
  emit(new AvailabilityExpiredEvent("expired-1",1L,2L,supplier.getId(),"Hôtel",LocalDateTime.now(clock),true));
  assertEquals(2,rows(supplier).size());
  for(User u:List.of(client,otherSupplier,agent,admin))assertTrue(rows(u).isEmpty());
 }
 @Test void moderationRecipientsAndReason(){
  emit(new OfferModerationChangedEvent("moderated-1",2L,supplier.getId(),"Offre",false,"Informations incomplètes"));
  assertEquals(NotificationType.OFFER_DEACTIVATED,rows(supplier).getFirst().type());
  assertTrue(rows(supplier).getFirst().message().contains("Informations incomplètes"));
  emit(new OfferModerationChangedEvent("moderated-2",2L,supplier.getId(),"Offre",true,null));
  assertEquals(2,rows(supplier).size());assertTrue(rows(otherSupplier).isEmpty());assertTrue(rows(admin).isEmpty());
 }
 @Test void ticketStaffReplyOnlyRequester(){
  emit(new TicketRepliedEvent("ticket-1",55L,"TK-55",client.getId(),agent.getId(),agent.getId(),"Assistance","Réponse"));
  assertEquals(1,rows(client).size());assertTrue(rows(agent).isEmpty());assertTrue(rows(other).isEmpty());
 }
 @Test void ticketRequesterReplyOnlyAssignee(){
  emit(new TicketRepliedEvent("ticket-2",55L,"TK-55",client.getId(),agent.getId(),client.getId(),"Assistance","Réponse client"));
  assertEquals(1,rows(agent).size());assertTrue(rows(client).isEmpty());assertTrue(rows(admin).isEmpty());
 }
 @Test void duplicateRecipientAndEventOnlyOnce(){
  var n=notice();var mixed=new BookingNotice(n.bookingId(),agent.getId(),n.reference(),n.total(),n.startAt(),n.endAt(),n.lines());
  emit(new BookingCreatedEvent("dedup-1",mixed));emit(new BookingCreatedEvent("dedup-1",mixed));
  assertEquals(1,rows(agent).size());assertEquals(1,rows(supplier).size());
 }
 @Test void archivedNeverReceives(){
  emit(new UserRegisteredEvent("welcome-archived",archived.getId()));
  emit(new AvailabilityLowEvent("low-archived",1L,2L,archived.getId(),"Offre",1,10));
  assertTrue(rows(archived).isEmpty());assertTrue(mails.isEmpty());
 }
 @Test void rollbackDoesNotNotify(){
  new TransactionTemplate(manager).executeWithoutResult(s->{publisher.publishEvent(new UserRegisteredEvent("rollback",client.getId()));s.setRollbackOnly();});
  drain();assertTrue(rows(client).isEmpty());assertTrue(mails.isEmpty());
 }
 @Test void notificationFailureDoesNotFailRegistration(){
  doThrow(new IllegalStateException("Panne simulée")).when(notifications).notify(anyLong(),any(),any(),any(),any(),any(),any(),any());
  var request=new RegisterRequest();request.setFullName("Inscription conservée");request.setEmail("failure-"+UUID.randomUUID()+"@test.ma");request.setPassword("Atlas!Voyage2026");
  var result=assertDoesNotThrow(()->auth.register(request));drain();
  assertTrue(users.findById(result.getUser().getId()).isPresent());
 }
 @Test void smtpFailureDoesNotFailBusinessAndRetriesTwice(){
  doThrow(new org.springframework.mail.MailSendException("Panne SMTP")).when(sender).send(any(MimeMessage.class));
  assertDoesNotThrow(()->emit(new UserRegisteredEvent("smtp-failure",client.getId())));
  assertEquals(1,rows(client).size());verify(sender,times(2)).send(any(MimeMessage.class));
 }
 @Test void inAppDisabledButEmailStillPossible(){
  notifications.updatePreferences(client.getId(),new NotificationPreferenceRequest(true,false,true,true,true,true));
  emit(new UserRegisteredEvent("pref-inapp",client.getId()));
  assertTrue(rows(client).isEmpty());assertEquals(1,mails.size());
 }
 @Test void emailGlobalAndCategoryPreferences(){
  notifications.updatePreferences(client.getId(),new NotificationPreferenceRequest(false,true,true,true,true,true));
  emit(new PaymentFailedEvent("pref-email",22L,notice(),"Refus"));
  assertTrue(mails.isEmpty());assertEquals(1,rows(client).size());
  emit(new UserRegisteredEvent("account-despite-global-disabled",client.getId()));assertEquals(1,mails.size());mails.clear();
  notifications.updatePreferences(client.getId(),new NotificationPreferenceRequest(true,true,true,false,true,true));
  emit(new PaymentFailedEvent("pref-category",22L,notice(),"Refus"));assertTrue(mails.isEmpty());
  emit(new UserRegisteredEvent("pref-account",client.getId()));assertEquals(1,mails.size());
 }
 @Test void emailDedupWhenInAppDisabled(){
  notifications.updatePreferences(client.getId(),new NotificationPreferenceRequest(true,false,true,true,true,true));
  emit(new UserRegisteredEvent("same-email",client.getId()));emit(new UserRegisteredEvent("same-email",client.getId()));
  assertEquals(1,mails.size());assertTrue(rows(client).isEmpty());
 }
 @Test void globalMailDisabledNeverSends(){
  var disabled=new EmailService(sender,templates,new NotificationMailProperties(false,"noreply@atlasvoyage.test"));
  disabled.send("test@example.com","Sujet","welcome",Map.of());verify(sender,never()).send(any(MimeMessage.class));
 }
 @Test void htmlAndPlainBodiesAreEscaped()throws Exception{
  tx(()->{var u=users.findById(client.getId()).orElseThrow();u.setFullName("<script>alert(1)</script>");return null;});
  emit(new UserRegisteredEvent("email-html",client.getId()));assertEquals(1,mails.size());
  var message=mails.getFirst();assertEquals(client.getEmail(),message.getAllRecipients()[0].toString());
  assertTrue(message.getSubject().contains("Bienvenue"));
  Multipart mixed=(Multipart)message.getContent();String serialized=serialize(message);
  assertTrue(serialized.contains("text/plain"));assertTrue(serialized.contains("text/html"));
  assertTrue(serialized.contains("&lt;script&gt;"));assertFalse(serialized.contains("<script>"));
 }
 String serialize(MimeMessage message)throws Exception{message.saveChanges();var out=new java.io.ByteArrayOutputStream();message.writeTo(out);return out.toString(java.nio.charset.StandardCharsets.UTF_8);}
 @Test void endpointOwnershipAndReadIdempotence()throws Exception{
  var n=direct(client,"owned");var foreign=direct(other,"foreign");drain();
  mvc.perform(get("/api/notifications")).andExpect(status().isUnauthorized());
  for(String endpoint:List.of("/api/notifications/"+foreign.id()+"/read")){
   mvc.perform(post(endpoint).with(user(new AppUserDetails(client)))).andExpect(status().isNotFound());
  }
  mvc.perform(delete("/api/notifications/"+foreign.id()).with(user(new AppUserDetails(client)))).andExpect(status().isNotFound());
  var first=notifications.markRead(client.getId(),n.id());var second=notifications.markRead(client.getId(),n.id());assertEquals(first.readAt(),second.readAt());
  mvc.perform(get("/api/notifications?size=999&read=true&category=SYSTEM&type=SYSTEM").with(user(new AppUserDetails(client))))
   .andExpect(status().isOk()).andExpect(jsonPath("$.size").value(50)).andExpect(jsonPath("$.totalElements").value(1));
  mvc.perform(get("/api/notifications/unread-count").with(user(new AppUserDetails(client)))).andExpect(jsonPath("$.count").value(0));
 }
 @Test void markAllAndDeleteOnlyCurrent()throws Exception{
  var n=direct(client,"all-1");direct(client,"all-2");direct(other,"all-other");drain();
  mvc.perform(post("/api/notifications/read-all").with(user(new AppUserDetails(client)))).andExpect(jsonPath("$.updated").value(2));
  assertEquals(1,notifications.unreadCount(other.getId()));
  mvc.perform(post("/api/notifications/read-all").with(user(new AppUserDetails(client)))).andExpect(jsonPath("$.updated").value(0));
  mvc.perform(delete("/api/notifications/"+n.id()).with(user(new AppUserDetails(client)))).andExpect(status().isNoContent());
 }
 @Test void preferencesDefaultsValidationAndRoles()throws Exception{
  assertTrue(notifications.preferences(client.getId()).emailEnabled());assertFalse(preferences.existsById(client.getId()));
  mvc.perform(put("/api/notifications/preferences").with(user(new AppUserDetails(client))).contentType("application/json").content("{}")).andExpect(status().isBadRequest());
  String body="{\"emailEnabled\":false,\"inAppEnabled\":true,\"bookingEmail\":false,\"paymentEmail\":true,\"offerEmail\":true,\"supportEmail\":false}";
  mvc.perform(put("/api/notifications/preferences").with(user(new AppUserDetails(client))).contentType("application/json").content(body)).andExpect(status().isOk()).andExpect(jsonPath("$.emailEnabled").value(false));
  for(User u:List.of(client,supplier,agent,admin))mvc.perform(get("/api/notifications/preferences").with(user(new AppUserDetails(u)))).andExpect(status().isOk());
 }
 @Test void invalidLinksRejected(){
  for(String link:List.of("javascript:alert(1)","http://evil.com","//evil.com","/\\evil.com","/%2Fevil.com","/x<script>","../connexion.html"))
   assertThrows(BusinessException.class,()->notifications.notify(client.getId(),NotificationType.SYSTEM,"Titre","Message",link,null,null,null));
  assertEquals("/frontend/client/index.html?page=notifications",NotificationLinks.validate("/frontend/client/index.html?page=notifications"));
 }
 @Test void purgeBoundaries(){
  tx(()->{for(int days:List.of(89,90,91,179,180,181)){Notification n=new Notification();n.setUser(client);n.setMessage("Ancien");n.setCreatedAt(LocalDateTime.now(clock).minusDays(days));n.setIsRead(days<=91);repository.save(n);}return null;});
  assertEquals(2,notifications.purgeOld());assertEquals(4,rows(client).size());
 }
 Hotel offer(boolean active,int capacity,LocalDateTime end){
  return tx(()->{Hotel h=new Hotel();h.setTitle("Offre notification");h.setBasePrice(100d);h.setCity(cities.save(new City("Ville "+UUID.randomUUID(),1d,2d)));
   h.setSupplier(supplier);h.setActive(active);h.setAvailabilities(List.of(new OfferAvailability(LocalDateTime.now(clock).minusDays(2),end,capacity)));
   return (Hotel)offers.saveAndFlush(h);});
 }
 @Test void schedulerDedupAndThresholds(){
  assertTrue(alerts.isLow(2,100));assertTrue(alerts.isLow(20,100));assertFalse(alerts.isLow(21,100));
  offer(true,1,LocalDateTime.now(clock).plusDays(2));offer(false,0,LocalDateTime.now(clock).minusDays(1));
  alerts.scan();drain();assertEquals(2,rows(supplier).size());alerts.scan();drain();assertEquals(2,rows(supplier).size());
  assertTrue(rows(otherSupplier).isEmpty());
 }
 @Test void expiredAlertOnce(){
  offer(true,3,LocalDateTime.now(clock).minusHours(1));alerts.scan();alerts.scan();drain();
  assertEquals(1,rows(supplier).size());assertEquals(NotificationType.AVAILABILITY_EXPIRED,rows(supplier).getFirst().type());
 }
 @Test void realRegistrationCreatesWelcomeAndMail(){
  var r=new RegisterRequest();r.setFullName("Nouveau client");r.setEmail("register-"+UUID.randomUUID()+"@test.ma");r.setPassword("Atlas!Voyage2026");
  var response=auth.register(r);drain();
  assertEquals(1,notifications.list(response.getUser().getId(),null,null,null,0,20).getTotalElements());
  assertEquals(2,mails.size()); // Bienvenue Phase 4 + lien de vérification Phase 6.
  assertFalse(response.getUser().isEmailVerified());
 }
 @Test void realModerationNotifiesOnlyOwner(){
  var hotel=offer(true,10,LocalDateTime.now(clock).plusDays(10));
  offersService.moderate(hotel.getId(),false,"Description à corriger",admin.getId());drain();
  assertEquals(1,rows(supplier).size());assertTrue(rows(otherSupplier).isEmpty());assertTrue(rows(admin).isEmpty());
 }
 @Test void concurrentDedupUnique()throws Exception{
  var pool=Executors.newFixedThreadPool(4);try{
   var tasks=new ArrayList<Callable<NotificationResponse>>();for(int i=0;i<8;i++)tasks.add(()->direct(client,"concurrent"));
   for(var result:pool.invokeAll(tasks))result.get();drain();assertEquals(1,rows(client).size());assertEquals(1,mails.size());
  }finally{pool.shutdownNow();}
 }
 @Test void demoSeederIsIdempotentAndDoesNotSendMail(){
  tx(()->{for(String email:List.of("sarah.benali@example.com","karim.idrissi@atlasvoyage.ma","vols@atlasvoyage.ma","voitures@atlasvoyage.ma","transferts@atlasvoyage.ma","excursions@atlasvoyage.ma","nadia.elfassi@atlasvoyage.ma","omar.tazi@atlasvoyage.ma"))users.save(new User("Démo",email,"hash",Role.CLIENT));return null;});
  long before=repository.count();seeder.seed();long count=repository.count();seeder.seed();drain();
  assertEquals(before+16,count);assertEquals(count,repository.count());assertTrue(mails.isEmpty());
 }
 @Test void notifyManyDeduplicates(){
  notifications.notifyMany(List.of(client.getId(),client.getId(),other.getId()),NotificationType.SYSTEM,"Informations","Message",null,null,null,"notify-many");drain();
  assertEquals(1,rows(client).size());assertEquals(1,rows(other).size());assertEquals(2,mails.size());
 }
 @Test void pageBeyondEndAndTypeCategoryFilters()throws Exception{
  emit(new UserRegisteredEvent("filter-account",client.getId()));direct(client,"filter-system");drain();
  mvc.perform(get("/api/notifications?category=ACCOUNT&type=ACCOUNT_WELCOME").with(user(new AppUserDetails(client))))
   .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
  mvc.perform(get("/api/notifications?page=99").with(user(new AppUserDetails(client))))
   .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(0));
  mvc.perform(get("/api/notifications?category=UNKNOWN").with(user(new AppUserDetails(client)))).andExpect(status().isBadRequest());
 }
}
