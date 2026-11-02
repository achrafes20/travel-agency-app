package com.agence.voyage.payment;

import com.agence.voyage.dto.*;
import com.agence.voyage.entity.*;
import com.agence.voyage.exception.*;
import com.agence.voyage.service.*;
import com.agence.voyage.config.PaymentProperties;
import org.junit.jupiter.api.*;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import com.agence.voyage.security.AppUserDetails;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class PaymentIntegrationTest extends PaymentTestSupport {
 @Test void cardSuccessConfirmsAndTraces(){
  var b=booking(PaymentMethod.ONLINE);var p=pay(b,"tok_sandbox_success");
  assertEquals(PaymentStatus.PAID,p.status());assertEquals(BookingStatus.CONFIRMED,p.bookingStatus());assertEquals(new BigDecimal("1000.00"),p.amount());
  assertEquals(39,capacity());assertEquals(3,events.countByPaymentId(p.id()));assertEquals(3,auditCount(p.id()));assertEquals("4242",p.cardLast4());assertNull(p.failureCode());
 }
 @Test void declinedRetryUsesNewAttempt(){
  var b=booking(PaymentMethod.ONLINE);var failed=pay(b,"tok_sandbox_declined");
  assertEquals(PaymentStatus.FAILED,failed.status());assertEquals(BookingStatus.PENDING,failed.bookingStatus());assertEquals("CARD_DECLINED",failed.failureCode());
  var success=pay(b,"tok_sandbox_success");assertNotEquals(failed.id(),success.id());assertEquals(PaymentStatus.PAID,success.status());
 }
 @Test void insufficientFunds(){var p=pay(booking(PaymentMethod.ONLINE),"tok_sandbox_insufficient_funds");assertEquals(PaymentStatus.FAILED,p.status());assertEquals("INSUFFICIENT_FUNDS",p.failureCode());}
 @Test void transientError(){var p=pay(booking(PaymentMethod.ONLINE),"tok_sandbox_error");assertEquals(PaymentStatus.FAILED,p.status());assertEquals(BookingStatus.PENDING,p.bookingStatus());}
 @Test void gatewayExceptionIsSafe(){
  doThrow(new IllegalStateException("private provider diagnostic")).when(gateway).charge(any());
  var p=pay(booking(PaymentMethod.ONLINE),"tok_sandbox_success");assertEquals("GATEWAY_UNAVAILABLE",p.failureCode());assertFalse(p.failureMessage().contains("private"));
 }
 @Test void gatewayOutsideTransaction(){
  doAnswer(call->{assertFalse(org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive());return call.callRealMethod();}).when(gateway).charge(any());
  assertEquals(PaymentStatus.PAID,pay(booking(PaymentMethod.ONLINE),"tok_sandbox_success").status());
 }
 @Test void ownerRequired(){var b=booking(PaymentMethod.ONLINE);error(ErrorCode.PAYMENT_NOT_FOUND,()->service.initiate(other.getId(),key(),card(b.id(),"tok_sandbox_success"),null));}
 @Test void expiredAndCancelledCannotPay(){
  var b=booking(PaymentMethod.ONLINE);clock.value=clock.value.plusSeconds(1801);error(ErrorCode.BOOKING_NOT_PAYABLE,()->pay(b,"tok_sandbox_success"));
  bookingService.expire(b.id());error(ErrorCode.BOOKING_NOT_PAYABLE,()->pay(b,"tok_sandbox_success"));
 }
 @Test void cancelledCannotPay(){
  var b=booking(PaymentMethod.ONLINE);bookingService.cancel(client.getId(),b.id(),null);error(ErrorCode.BOOKING_NOT_PAYABLE,()->pay(b,"tok_sandbox_success"));
 }
 @Test void idempotentReplaySamePayment(){
  var b=booking(PaymentMethod.ONLINE);String key=key();var r=card(b.id(),"tok_sandbox_success");
  var first=service.initiate(client.getId(),key,r,null);var replay=service.initiate(client.getId(),key,r,null);
  assertEquals(201,first.status());assertEquals(200,replay.status());assertEquals(first.body(),replay.body());verify(gateway,times(1)).charge(any());
 }
 @Test void keyReuseDifferentBody(){
  var b=booking(PaymentMethod.ONLINE);String key=key();service.initiate(client.getId(),key,card(b.id(),"tok_sandbox_declined"),null);
  var ex=assertThrows(BusinessException.class,()->service.initiate(client.getId(),key,card(b.id(),"tok_sandbox_success"),null));
  assertEquals(ErrorCode.IDEMPOTENCY_KEY_REUSED,ex.getCode());assertEquals(422,ex.getStatus().value());
 }
 @Test void keyRequiredAndCardKeyRejected(){
  var b=booking(PaymentMethod.ONLINE);error(ErrorCode.IDEMPOTENCY_KEY_REQUIRED,()->service.initiate(client.getId(),null,card(b.id(),"tok_sandbox_success"),null));
  error(ErrorCode.CARD_DATA_REJECTED,()->service.initiate(client.getId(),"4242424242424242",card(b.id(),"tok_sandbox_success"),null));
 }
 @Test void clientAmountIgnored()throws Exception{
  var b=booking(PaymentMethod.ONLINE);
  postPayment("{\"bookingId\":"+b.id()+",\"method\":\"CARD\",\"cardToken\":\"tok_sandbox_success\",\"cardLast4\":\"4242\",\"cardBrand\":\"VISA\",\"amount\":0.01}",key(),client)
   .andExpect(status().isCreated()).andExpect(jsonPath("$.amount").value(1000)).andExpect(header().string("Cache-Control","no-store"));
 }
 @Test void sensitiveDataRejectedAndNeverPersisted()throws Exception{
  var b=booking(PaymentMethod.ONLINE);String pan="4242424242424242";
  var root=(ch.qos.logback.classic.Logger)org.slf4j.LoggerFactory.getLogger(org.slf4j.Logger.ROOT_LOGGER_NAME);
  var appender=new ch.qos.logback.core.read.ListAppender<ch.qos.logback.classic.spi.ILoggingEvent>();appender.start();root.addAppender(appender);
  try{
   for(String extra:List.of(",\"cardNumber\":\""+pan+"\"",",\"nested\":{\"number\":\"4242 4242 4242 4242\"}",",\"CVV\":\"123\"")){
    postPayment("{\"bookingId\":"+b.id()+",\"method\":\"CARD\",\"cardToken\":\"tok_sandbox_success\""+extra+"}",key(),client)
      .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("CARD_DATA_REJECTED"));
   }
   assertTrue(appender.list.stream().noneMatch(e->e.getFormattedMessage().contains(pan)));
   var p=queries.forBooking(client.getId(),b.id()).getFirst();
   assertTrue(queries.events(client.getId(),p.id()).stream().noneMatch(e->String.valueOf(e.details()).contains(pan)));
   assertTrue(audit.findByResourceTypeAndResourceIdOrderByIdAsc("PAYMENT",p.id()).stream().noneMatch(e->String.valueOf(e.getAfterJson()).contains(pan)));
  }finally{root.detachAppender(appender);appender.stop();}
 }
 @Test void partialThenFullRefundRestoresExactlyOnce(){
  var b=booking(PaymentMethod.ONLINE);var paid=pay(b,"tok_sandbox_success");
  var first=service.refund(admin.getId(),paid.id(),key(),new PaymentRefundRequest(new BigDecimal("250.00"),"Remboursement partiel"),null).body();
  assertEquals(PaymentStatus.PARTIALLY_REFUNDED,first.status());assertEquals(new BigDecimal("250.00"),first.refundedAmount());assertEquals(39,capacity());
  assertTrue(queries.events(admin.getId(),paid.id()).stream().anyMatch(e->e.details()!=null&&e.details().contains("Remboursement partiel")));
  String key=key();var req=new PaymentRefundRequest(null,"Solde du remboursement");var last=service.refund(admin.getId(),paid.id(),key,req,null).body();
  assertEquals(PaymentStatus.REFUNDED,last.status());assertEquals(new BigDecimal("1000.00"),last.refundedAmount());assertEquals(BookingStatus.CANCELLED,last.bookingStatus());assertEquals(40,capacity());
  assertEquals(last,service.refund(admin.getId(),paid.id(),key,req,null).body());assertEquals(40,capacity());
 }
 @Test void refundCumulativeAndExcess(){
  var p=pay(booking(PaymentMethod.ONLINE),"tok_sandbox_success");
  service.refund(admin.getId(),p.id(),key(),new PaymentRefundRequest(new BigDecimal("600"),"Partiel"),null);
  error(ErrorCode.REFUND_EXCEEDS_PAID,()->service.refund(admin.getId(),p.id(),key(),new PaymentRefundRequest(new BigDecimal("401"),"Trop"),null));
  assertEquals(new BigDecimal("600.00"),queries.get(client.getId(),p.id()).refundedAmount());
 }
 @Test void refundRequiresAdminAndPaid(){
  var b=booking(PaymentMethod.ONLINE);var p=queries.forBooking(client.getId(),b.id()).getFirst();
  assertThrows(ForbiddenException.class,()->service.refund(agent.getId(),p.id(),key(),new PaymentRefundRequest(null,"Demande"),null));
  error(ErrorCode.PAYMENT_NOT_ALLOWED,()->service.refund(admin.getId(),p.id(),key(),new PaymentRefundRequest(null,"Demande"),null));
 }
 @Test void refundGatewayFailureReleasesReservation(){
  var p=pay(booking(PaymentMethod.ONLINE),"tok_sandbox_success");String key=key();
  doThrow(new IllegalStateException("provider error")).when(gateway).refund(anyString(),any(),anyString());
  var req=new PaymentRefundRequest(null,"Demande");error(ErrorCode.PAYMENT_FAILED,()->service.refund(admin.getId(),p.id(),key,req,null));
  assertEquals(new BigDecimal("1000.00"),queries.get(client.getId(),p.id()).refundableAmount());
  error(ErrorCode.PAYMENT_FAILED,()->service.refund(admin.getId(),p.id(),key,req,null));
 }
 @Test void cashCollectedOnceAndTraced(){
  var p=cash();String key=key();var req=new CashCollectionRequest(p.amount(),"Espèces reçues");
  var result=service.collect(agent.getId(),p.id(),key,req,null).body();assertEquals(PaymentStatus.PAID,result.status());assertEquals(agent.getId(),result.collectedBy());
  assertEquals(result,service.collect(agent.getId(),p.id(),key,req,null).body());
  error(ErrorCode.PAYMENT_ALREADY_PAID,()->service.collect(agent.getId(),p.id(),key(),req,null));
  assertTrue(events.findByPaymentIdOrderByIdAsc(p.id()).stream().anyMatch(e->e.getEventType().equals("CASH_COLLECTED")));
 }
 @Test void wrongCashAmountAndWrongMethod(){
  var p=cash();error(ErrorCode.INVALID_AMOUNT,()->service.collect(agent.getId(),p.id(),key(),new CashCollectionRequest(new BigDecimal("999"),null),null));
  var online=queries.forBooking(client.getId(),booking(PaymentMethod.ONLINE).id()).getFirst();
  error(ErrorCode.CASH_PAYMENT_NOT_ALLOWED,()->service.collect(agent.getId(),online.id(),key(),new CashCollectionRequest(online.amount(),null),null));
 }
 @Test void cashForbiddenForClientAndSupplier(){
  var p=cash();for(User u:List.of(client,supplier))assertThrows(ForbiddenException.class,()->service.collect(u.getId(),p.id(),key(),new CashCollectionRequest(p.amount(),null),null));
 }
 @Test void cashSelectionRevalidatesOffers(){
  var b=booking(PaymentMethod.ONLINE);tx(()->{offers.findById(hotel.getId()).orElseThrow().setAllowsPayOnArrival(false);return null;});
  error(ErrorCode.CASH_PAYMENT_NOT_ALLOWED,()->service.initiate(client.getId(),key(),new PaymentCreateRequest(b.id(),PaymentMethod.CASH_ON_ARRIVAL,null,null,null),null));
 }
 @Test void cashCanBeSelectedAndNoCardMetadataAllowed(){
  var b=booking(PaymentMethod.ONLINE);
  error(ErrorCode.CARD_DATA_REJECTED,()->service.initiate(client.getId(),key(),new PaymentCreateRequest(b.id(),PaymentMethod.CASH_ON_ARRIVAL,"tok_sandbox_success",null,null),null));
  var r=service.initiate(client.getId(),key(),new PaymentCreateRequest(b.id(),PaymentMethod.CASH_ON_ARRIVAL,null,null,null),null).body();
  assertEquals(BookingStatus.CONFIRMED,r.bookingStatus());assertEquals(PaymentStatus.PENDING,r.status());assertNull(r.expiresAt());
 }
 @Test void expirationCancelsActiveAndRestoresOnce(){
  var b=booking(PaymentMethod.ONLINE);var p=queries.forBooking(client.getId(),b.id()).getFirst();
  clock.value=clock.value.plusSeconds(1801);new PaymentExpirationJob(bookings,bookingService,clock,bookingProperties).expire();
  assertEquals(BookingStatus.EXPIRED,bookings.findById(b.id()).orElseThrow().getStatus());assertEquals(PaymentStatus.CANCELLED,queries.get(client.getId(),p.id()).status());assertEquals(40,capacity());
  assertFalse(bookingService.expire(b.id()));assertEquals(40,capacity());
 }
 @Test void failedPaymentStillExpires(){
  var b=booking(PaymentMethod.ONLINE);pay(b,"tok_sandbox_declined");clock.value=clock.value.plusSeconds(1801);assertTrue(bookingService.expire(b.id()));assertEquals(40,capacity());
 }
 @Test void captureAfterCancellationCompensated(){
  var b=booking(PaymentMethod.ONLINE);
  doAnswer(call->{bookingService.cancel(client.getId(),b.id(),null);return call.callRealMethod();}).when(gateway).charge(any());
  var p=pay(b,"tok_sandbox_success");assertEquals(PaymentStatus.REFUNDED,p.status());assertEquals(BookingStatus.CANCELLED,p.bookingStatus());assertEquals(40,capacity());
 }
 @Test void paymentListsSecurityAndPagination()throws Exception{
  var p=cash();
  var empty=new PaymentQueries.Filters(null,null,null,null,null);
  assertEquals(1,queries.list(client.getId(),"mine",empty,0,1000,null).getTotalElements());assertEquals(100,queries.list(client.getId(),"mine",empty,0,1000,null).getSize());
  assertTrue(queries.list(agent.getId(),"cash-pending",new PaymentQueries.Filters(PaymentStatus.PENDING,PaymentMethod.CASH_ON_ARRIVAL,clock.instant().atOffset(java.time.ZoneOffset.UTC).toLocalDate(),null,p.bookingReference()),0,20,"amount,asc").getTotalElements()>0);
  service.collect(agent.getId(),p.id(),key(),new CashCollectionRequest(p.amount(),null),null);
  assertEquals(1,queries.list(agent.getId(),"cash-history",empty,0,20,null).getTotalElements());assertEquals(0,queries.list(agent2.getId(),"cash-history",empty,0,20,null).getTotalElements());
  assertTrue(queries.list(admin.getId(),"admin",new PaymentQueries.Filters(PaymentStatus.PAID,PaymentMethod.CASH_ON_ARRIVAL,null,null,p.bookingReference()),0,20,null).getTotalElements()>0);
  error(ErrorCode.PAYMENT_NOT_FOUND,()->queries.get(other.getId(),p.id()));error(ErrorCode.PAYMENT_NOT_FOUND,()->queries.events(supplier.getId(),p.id()));
  assertThrows(ForbiddenException.class,()->queries.list(client.getId(),"admin",empty,0,20,null));
  error(ErrorCode.BAD_REQUEST,()->queries.list(client.getId(),"mine",empty,0,20,"client.password,asc"));
  mvc.perform(get("/api/payments/"+p.id()).with(user(new AppUserDetails(other)))).andExpect(status().isNotFound());
  mvc.perform(get("/api/payments")).andExpect(status().isUnauthorized());
  for(String scope:List.of("admin","cash-pending","cash-history"))mvc.perform(get("/api/payments/"+scope).with(user(new AppUserDetails(client)))).andExpect(status().isForbidden());
  mvc.perform(post("/api/payments/"+p.id()+"/refund").with(user(new AppUserDetails(agent))).contentType("application/json").content("{\"reason\":\"Demande\"}")).andExpect(status().isForbidden());
 }
 @Test void immutableHistoryIgnoresChangesAndRefusesRemoval(){
  var p=pay(booking(PaymentMethod.ONLINE),"tok_sandbox_success");
  tx(()->{var e=events.findByPaymentIdOrderByIdAsc(p.id()).getFirst();e.setDetails("modification");return null;});
  assertNotEquals("modification",events.findByPaymentIdOrderByIdAsc(p.id()).getFirst().getDetails());
  assertThrows(RuntimeException.class,()->tx(()->{em.remove(em.merge(events.findByPaymentIdOrderByIdAsc(p.id()).getFirst()));em.flush();return null;}));
 }
 @Test void integrityOfCapturedBooking(){
  var b=booking(PaymentMethod.ONLINE);pay(b,"tok_sandbox_success");
  var paid=queries.forBooking(client.getId(),b.id()).stream().filter(p->p.status()==PaymentStatus.PAID).toList();
  assertEquals(1,paid.size());assertEquals(b.total(),paid.getFirst().amount());assertTrue(paid.getFirst().refundedAmount().compareTo(paid.getFirst().amount())<=0);
 }
}

