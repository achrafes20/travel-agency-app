package com.agence.voyage.payment;
import com.agence.voyage.dto.*;
import com.agence.voyage.entity.*;
import com.agence.voyage.exception.*;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class PaymentWebhookTest extends PaymentTestSupport {
 @Test void validSignatureConfirmsAndDuplicateIgnored()throws Exception{
  var b=booking(PaymentMethod.ONLINE);var p=queries.forBooking(client.getId(),b.id()).getFirst();String id="evt_"+key();
  byte[] body=payload(id,"payment.succeeded",p,",\"amount\":1000.00");
  assertEquals("PROCESSED",send(body).status());long count=events.countByPaymentId(p.id());
  assertEquals("IGNORED",send(body).status());assertEquals(count,events.countByPaymentId(p.id()));
  assertEquals(PaymentStatus.PAID,queries.get(client.getId(),p.id()).status());assertEquals(BookingStatus.CONFIRMED,bookings.findById(b.id()).orElseThrow().getStatus());
 }
 @Test void invalidSignatureAndTimestampHaveNoEffect()throws Exception{
  var p=queries.forBooking(client.getId(),booking(PaymentMethod.ONLINE).id()).getFirst();byte[] body=payload("evt_"+key(),"payment.succeeded",p,"");
  error(ErrorCode.INVALID_WEBHOOK_SIGNATURE,()->webhook.receive(body,"00",Long.toString(clock.instant().getEpochSecond())));
  error(ErrorCode.INVALID_WEBHOOK_SIGNATURE,()->webhook.receive(body,webhook.signature(body),Long.toString(clock.instant().minusSeconds(301).getEpochSecond())));
  error(ErrorCode.INVALID_WEBHOOK_SIGNATURE,()->webhook.receive(body,webhook.signature(body),"bad"));
  assertEquals(PaymentStatus.PENDING,queries.get(client.getId(),p.id()).status());assertEquals(1,events.countByPaymentId(p.id()));
 }
 @Test void paidDoesNotRegressOnFailure()throws Exception{
  var p=pay(booking(PaymentMethod.ONLINE),"tok_sandbox_success");assertEquals("IGNORED",send(payload("evt_"+key(),"payment.failed",p,"")).status());
  assertEquals(PaymentStatus.PAID,queries.get(client.getId(),p.id()).status());
 }
 @Test void failedAttemptDoesNotReviveOnLateSuccess()throws Exception{
  var p=queries.forBooking(client.getId(),booking(PaymentMethod.ONLINE).id()).getFirst();
  assertEquals("PROCESSED",send(payload("evt_"+key(),"payment.failed",p,"")).status());
  assertEquals("IGNORED",send(payload("evt_"+key(),"payment.succeeded",p,"")).status());
  assertEquals(PaymentStatus.FAILED,queries.get(client.getId(),p.id()).status());
 }
 @Test void cumulativeRefundWebhookAndCapacity()throws Exception{
  var p=pay(booking(PaymentMethod.ONLINE),"tok_sandbox_success");
  assertEquals("PROCESSED",send(payload("evt_"+key(),"payment.refunded",p,",\"refundedAmount\":250")).status());
  assertEquals(PaymentStatus.PARTIALLY_REFUNDED,queries.get(client.getId(),p.id()).status());assertEquals(39,capacity());
  assertEquals("IGNORED",send(payload("evt_"+key(),"payment.refunded",p,",\"refundedAmount\":250")).status());
  assertEquals("PROCESSED",send(payload("evt_"+key(),"payment.refunded",p,"")).status());
  assertEquals(PaymentStatus.REFUNDED,queries.get(client.getId(),p.id()).status());assertEquals(40,capacity());
  assertEquals("IGNORED",send(payload("evt_"+key(),"payment.succeeded",p,"")).status());assertEquals(40,capacity());
 }
 @Test void refundWebhookExcessRejected()throws Exception{
  var p=pay(booking(PaymentMethod.ONLINE),"tok_sandbox_success");
  byte[] body=payload("evt_"+key(),"payment.refunded",p,",\"refundedAmount\":1001");
  error(ErrorCode.REFUND_EXCEEDS_PAID,()->send(body));assertEquals(BigDecimal.ZERO.setScale(2),queries.get(client.getId(),p.id()).refundedAmount());
 }
 @Test void unknownTypeAndReferenceIgnored(){
  byte[] body=("{\"eventId\":\"evt_"+key()+"\",\"type\":\"unknown\",\"providerReference\":\"unknown\"}").getBytes(StandardCharsets.UTF_8);
  assertEquals("IGNORED",send(body).status());
 }
 @Test void publicWebhookRequiresSignature()throws Exception{
  var p=queries.forBooking(client.getId(),booking(PaymentMethod.ONLINE).id()).getFirst();byte[] body=payload("evt_"+key(),"payment.succeeded",p,"");
  mvc.perform(post("/api/payments/webhook").contentType("application/json").content(body).header("X-Atlas-Signature",webhook.signature(body)).header("X-Atlas-Timestamp",clock.instant().getEpochSecond()))
   .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PROCESSED")).andExpect(header().string("Cache-Control","no-store"));
  mvc.perform(post("/api/payments/webhook").contentType("application/json").content(body)).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("INVALID_WEBHOOK_SIGNATURE"));
 }
 @Test void expiredBookingNotConfirmedByWebhook()throws Exception{
  var b=booking(PaymentMethod.ONLINE);var p=queries.forBooking(client.getId(),b.id()).getFirst();clock.value=clock.value.plusSeconds(1801);
  assertEquals("IGNORED",send(payload("evt_"+key(),"payment.succeeded",p,"")).status());assertEquals(BookingStatus.PENDING,bookings.findById(b.id()).orElseThrow().getStatus());
 }
 @Test void succeededAmountMismatchRejected()throws Exception{
  var p=queries.forBooking(client.getId(),booking(PaymentMethod.ONLINE).id()).getFirst();
  byte[] body=payload("evt_"+key(),"payment.succeeded",p,",\"amount\":1");
  error(ErrorCode.INVALID_AMOUNT,()->send(body));assertEquals(PaymentStatus.PENDING,queries.get(client.getId(),p.id()).status());
 }
 @Test void malformedSignedPayloadSafe(){
  byte[] body="not JSON".getBytes(StandardCharsets.UTF_8);error(ErrorCode.BAD_REQUEST,()->send(body));
  byte[] array="[]".getBytes(StandardCharsets.UTF_8);error(ErrorCode.BAD_REQUEST,()->send(array));
 }
}

