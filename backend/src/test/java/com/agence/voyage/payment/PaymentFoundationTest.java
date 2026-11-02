package com.agence.voyage.payment;
import com.agence.voyage.config.*;
import com.agence.voyage.domain.PaymentTransitions;
import com.agence.voyage.entity.*;
import com.agence.voyage.exception.*;
import com.agence.voyage.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import java.time.*;
import java.util.Set;
import static org.junit.jupiter.api.Assertions.*;
import static org.assertj.core.api.Assertions.assertThat;

class PaymentFoundationTest {
 @Test void sensitiveDataGuardAndCanonicalHash()throws Exception{
  var mapper=new ObjectMapper();var guard=new PaymentDataGuard();
  assertTrue(PaymentDataGuard.luhn("4242424242424242"));assertFalse(PaymentDataGuard.luhn("123"));assertFalse(PaymentDataGuard.luhn("4242424242424241"));
  var json=mapper.readTree("{\"z\":[1,2],\"a\":{\"b\":true}}");assertEquals("{\"a\":{\"b\":true},\"z\":[1,2]}",guard.canonical(json).toString());guard.inspect(json);
  assertThrows(BusinessException.class,()->guard.inspect(mapper.readTree("{\"cVc\":null}")));
  assertThrows(BusinessException.class,()->guard.inspect(mapper.readTree("{\"note\":\"4242-4242-4242-4242\"}")));
  assertEquals(64,PaymentIdempotency.sha256("data").length());
 }
 @Test void productionAndInvalidConfigRejected(){
  var runner=new ApplicationContextRunner().withUserConfiguration(PaymentConfig.class)
   .withPropertyValues("payment.provider=sandbox","payment.webhook-secret=production-test-key-at-least-thirty-two-characters");
  runner.run(c->assertThat(c).hasNotFailed());
  runner.withInitializer(c->c.getEnvironment().setActiveProfiles("prod")).run(c->assertThat(c).hasFailed());
  runner.withPropertyValues("payment.provider=stripe").run(c->assertThat(c).hasFailed());
  runner.withPropertyValues("payment.webhook-secret=short").run(c->assertThat(c).hasFailed());
 }
 @Test void rateLimitAndReset(){
  class Mutable extends Clock {Instant t=Instant.parse("2026-11-01T00:00:00Z");public Instant instant(){return t;}public ZoneId getZone(){return ZoneOffset.UTC;}public Clock withZone(ZoneId z){return this;}}
  var clock=new Mutable();var props=new PaymentProperties("sandbox","test-key-at-least-thirty-two-characters",300,24,2);var limiter=new PaymentRateLimiter(clock,props);
  limiter.check(1L);limiter.check(1L);assertEquals(ErrorCode.PAYMENT_RATE_LIMITED,assertThrows(BusinessException.class,()->limiter.check(1L)).getCode());
  clock.t=clock.t.plusSeconds(61);assertDoesNotThrow(()->limiter.check(1L));assertDoesNotThrow(()->limiter.check(2L));
 }
 @Test void operationalStateMachine(){
  Set<String> allowed=Set.of("PENDING:PROCESSING","PENDING:PAID","PENDING:FAILED","PENDING:CANCELLED","PROCESSING:PAID","PROCESSING:FAILED","PROCESSING:CANCELLED","PAID:PARTIALLY_REFUNDED","PAID:REFUNDED","PARTIALLY_REFUNDED:PARTIALLY_REFUNDED","PARTIALLY_REFUNDED:REFUNDED");
  for(var from:PaymentStatus.values())for(var to:PaymentStatus.values())
   if(allowed.contains(from+":"+to))assertDoesNotThrow(()->PaymentTransitions.check(from,to,"EVENT"));
   else assertThrows(BusinessException.class,()->PaymentTransitions.check(from,to,"EVENT"));
  assertDoesNotThrow(()->PaymentTransitions.check(PaymentStatus.CANCELLED,PaymentStatus.PAID,"CAPTURED_AFTER_CANCELLATION"));
 }
}

