package com.agence.voyage.service;
import com.agence.voyage.dto.stats.StatsDtos.*;
import com.agence.voyage.repository.StatsRepository;
import com.agence.voyage.config.BookingModuleProperties;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
@Service
public class StatsAdminCalculator {
 private final StatsRepository repository;private final Clock clock;private final BookingModuleProperties booking;
 public StatsAdminCalculator(StatsRepository repository,Clock clock,BookingModuleProperties booking){this.repository=repository;this.clock=clock;this.booking=booking;}
 @Transactional(readOnly=true)
 public Admin calculate(String code){
  StatsPeriod p=StatsPeriod.resolve(code,clock),previous=p.previous();
  var users=repository.users(p);var previousUsers=repository.users(previous);
  var current=repository.totals(p,null,null);var before=repository.totals(previous,null,null);
  var points=StatsService.round(repository.series(p,null,null));
  var userStats=new UserStats(StatsService.kpi(users.total(),users.estimated()>0?null:users.previousPopulation()),
   StatsService.kpi(users.newUsers(),previousUsers.newUsers()),repository.roles(),users.active(),users.archived(),users.estimated());
  var bookingStats=new BookingStats(StatsService.kpi(current.count(),before.count()),repository.statuses(p,null,null),points);
  var revenueStats=new RevenueStats(StatsService.kpi(current.revenue(),before.revenue()),
   StatsService.kpi(current.pending(),before.pending()),StatsService.kpi(StatsService.average(current),StatsService.average(before)),points);
  List<Alert> alerts=new ArrayList<>();
  long unavailable=repository.withoutAvailability(null,LocalDateTime.now(clock));
  if(unavailable>0)alerts.add(new Alert("NO_AVAILABILITY","Offres actives sans capacité future",unavailable,"/frontend/admin/index.html?page=offers"));
  long late=repository.oldPending(LocalDateTime.now(clock).minusMinutes(booking.pendingExpirationMinutes()));
  if(late>0)alerts.add(new Alert("OLD_PENDING","Réservations en attente au-delà du délai de paiement",late,"/frontend/admin/index.html?page=bookings"));
  var destinations=repository.destinations(p).stream().map(d->new Destination(d.cityId(),d.name(),d.bookings(),StatsService.money(d.revenue()))).toList();
  var offers=repository.topOffers(p).stream().map(o->new TopOffer(o.id(),o.title(),o.type(),o.city(),o.bookings(),StatsService.money(o.revenue()))).toList();
  return new Admin(p.code(),p.from(),p.to(),StatsService.generated(clock),"Africa/Casablanca","MAD",userStats,bookingStats,revenueStats,
   destinations,offers,repository.promoWatch(p,LocalDate.now(clock.withZone(StatsPeriod.ZONE))),List.copyOf(alerts));
 }
}
