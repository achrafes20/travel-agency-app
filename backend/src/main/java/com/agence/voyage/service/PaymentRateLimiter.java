package com.agence.voyage.service;
import com.agence.voyage.config.PaymentProperties;
import com.agence.voyage.exception.*;
import org.springframework.stereotype.Component;
import org.springframework.http.HttpStatus;
import java.time.Clock;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
@Component
public class PaymentRateLimiter {
 private final Map<Long,Deque<Long>> windows=new ConcurrentHashMap<>();private final Clock clock;private final PaymentProperties properties;
 public PaymentRateLimiter(Clock clock,PaymentProperties properties){this.clock=clock;this.properties=properties;}
 public void check(Long userId){
  long now=clock.millis();Deque<Long> queue=windows.computeIfAbsent(userId,id->new ArrayDeque<>());
  synchronized(queue){
   while(!queue.isEmpty()&&queue.peekFirst()<=now-60000)queue.removeFirst();
   if(queue.size()>=properties.requestsPerMinute())throw new BusinessException(ErrorCode.PAYMENT_RATE_LIMITED,HttpStatus.TOO_MANY_REQUESTS,"Trop de tentatives de paiement. Réessayez dans une minute.");
   queue.addLast(now);
  }
  if(windows.size()>10000)windows.entrySet().removeIf(e->{synchronized(e.getValue()){return e.getValue().isEmpty()||e.getValue().peekLast()<now-60000;}});
 }
}

