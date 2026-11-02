package com.agence.voyage.service;
import com.agence.voyage.dto.stats.StatsDtos.Admin;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
/** Appelé uniquement après autorisation ; données globales communes aux seuls administrateurs. */
@Service
public class StatsAdminCache {
 private final StatsAdminCalculator calculator;
 public StatsAdminCache(StatsAdminCalculator calculator){this.calculator=calculator;}
 @Cacheable(cacheNames="adminStats",key="#period",sync=true)
 public Admin get(String period){return calculator.calculate(period);}
}
