package com.agence.voyage.payment;
import com.agence.voyage.dto.*;
import com.agence.voyage.entity.*;
import com.agence.voyage.exception.*;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
import java.util.function.IntFunction;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class PaymentConcurrencyTest extends PaymentTestSupport {
 List<Object> race(int n,IntFunction<Object> action)throws Exception{
  CountDownLatch ready=new CountDownLatch(n),go=new CountDownLatch(1);ExecutorService pool=Executors.newFixedThreadPool(n);
  try{
   List<Future<Object>> tasks=new ArrayList<>();
   for(int i=0;i<n;i++){int index=i;tasks.add(pool.submit(()->{ready.countDown();go.await();try{return action.apply(index);}catch(BusinessException e){return e.getCode();}}));}
   assertTrue(ready.await(10,TimeUnit.SECONDS));go.countDown();List<Object> results=new ArrayList<>();
   for(Future<Object> t:tasks)results.add(t.get(30,TimeUnit.SECONDS));return results;
  }finally{pool.shutdownNow();}
 }
 @Test void sameKeyTenThreadsOnlyOneDebit()throws Exception{
  var b=booking(PaymentMethod.ONLINE);String key=key();var request=card(b.id(),"tok_sandbox_success");
  doAnswer(call->{Thread.sleep(80);return call.callRealMethod();}).when(gateway).charge(any());
  List<Object> results=race(10,i->service.initiate(client.getId(),key,request,null).body());
  assertTrue(results.stream().allMatch(v->v instanceof PaymentResponse),results.toString());
  assertEquals(1,results.stream().map(v->((PaymentResponse)v).id()).distinct().count());
  assertTrue(results.stream().allMatch(v->((PaymentResponse)v).status()==PaymentStatus.PAID));verify(gateway,times(1)).charge(any());
 }
 @Test void differentKeysOnlyOneActivePayment()throws Exception{
  var b=booking(PaymentMethod.ONLINE);List<String> keys=java.util.stream.IntStream.range(0,10).mapToObj(i->key()).toList();
  var results=race(10,i->service.initiate(client.getId(),keys.get(i),card(b.id(),"tok_sandbox_success"),null).body());
  assertEquals(1,results.stream().filter(v->v instanceof PaymentResponse).count());
  assertTrue(results.stream().allMatch(v->v instanceof PaymentResponse||v==ErrorCode.PAYMENT_IN_PROGRESS||v==ErrorCode.PAYMENT_ALREADY_PAID));verify(gateway,times(1)).charge(any());
 }
 @Test void concurrentHttpReplayRefreshesOsivCache()throws Exception{
  var b=booking(PaymentMethod.ONLINE);String key=key();String json=mapper.writeValueAsString(card(b.id(),"tok_sandbox_success"));
  doAnswer(call->{Thread.sleep(100);return call.callRealMethod();}).when(gateway).charge(any());
  var replies=race(10,i->{
   try{
    var response=postPayment(json,key,client).andReturn().getResponse();
    assertTrue(response.getStatus()==200||response.getStatus()==201,"HTTP "+response.getStatus());
    return mapper.readTree(response.getContentAsString()).path("id").asLong();
   }catch(Exception e){throw new IllegalStateException(e);}
  });
  assertEquals(1,replies.stream().distinct().count());verify(gateway,times(1)).charge(any());
 }
 @Test void concurrentRefundCannotExceedPaid()throws Exception{
  var p=pay(booking(PaymentMethod.ONLINE),"tok_sandbox_success");
  doAnswer(call->{Thread.sleep(80);return call.callRealMethod();}).when(gateway).refund(anyString(),any(),anyString());
  var results=race(2,i->service.refund(admin.getId(),p.id(),key(),new PaymentRefundRequest(new BigDecimal("600"),"Partiel"),null).body());
  assertEquals(1,results.stream().filter(v->v instanceof PaymentResponse).count());assertTrue(results.contains(ErrorCode.REFUND_EXCEEDS_PAID));
  assertEquals(new BigDecimal("600.00"),queries.get(client.getId(),p.id()).refundedAmount());
 }
 @Test void sameRefundKeyOnlyOneRefund()throws Exception{
  var p=pay(booking(PaymentMethod.ONLINE),"tok_sandbox_success");String key=key();var req=new PaymentRefundRequest(null,"Demande");
  var results=race(10,i->service.refund(admin.getId(),p.id(),key,req,null).body());assertTrue(results.stream().allMatch(v->v instanceof PaymentResponse),results.toString());
  verify(gateway,times(1)).refund(anyString(),any(),anyString());assertEquals(40,capacity());
 }
 @Test void cashDoubleClickOnlyOneCollection()throws Exception{
  var p=cash();String key=key();var req=new CashCollectionRequest(p.amount(),null);
  var results=race(10,i->service.collect(agent.getId(),p.id(),key,req,null).body());assertTrue(results.stream().allMatch(v->v instanceof PaymentResponse));
  assertEquals(1,events.findByPaymentIdOrderByIdAsc(p.id()).stream().filter(e->e.getEventType().equals("CASH_COLLECTED")).count());
 }
 @Test void concurrentWebhookOnlyOneFinancialEffect()throws Exception{
  var b=booking(PaymentMethod.ONLINE);var p=queries.forBooking(client.getId(),b.id()).getFirst();byte[] body=payload("evt_"+key(),"payment.succeeded",p,"");
  var replies=race(10,i->send(body));assertEquals(1,replies.stream().filter(v->v instanceof com.agence.voyage.service.PaymentWebhookService.Reply r&&r.status().equals("PROCESSED")).count());
  assertEquals(1,events.findByPaymentIdOrderByIdAsc(p.id()).stream().filter(e->e.getEventType().equals("PAID")).count());
 }
}

