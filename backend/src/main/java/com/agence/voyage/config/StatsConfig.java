package com.agence.voyage.config;
import org.springframework.context.annotation.*;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import com.github.benmanes.caffeine.cache.Caffeine;
import java.time.Duration;
@Configuration @EnableCaching
public class StatsConfig {
 @Bean public org.springframework.cache.CacheManager cacheManager(){
  var manager=new CaffeineCacheManager("adminStats", "currencyRates");
  manager.setCaffeine(Caffeine.newBuilder().maximumSize(3).expireAfterWrite(Duration.ofMinutes(2)));
  return manager;
 }
}
