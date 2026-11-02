package com.agence.voyage.service;
import com.agence.voyage.dto.stats.StatsDtos.*;
import com.agence.voyage.entity.*;
import com.agence.voyage.exception.*;
import com.agence.voyage.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.math.*;
import java.util.*;
@Service @Transactional(readOnly=true)
public class StatsService {
 private final StatsRepository repository;private final UserRepository users;private final StatsAdminCache adminCache;private final Clock clock;
 public StatsService(StatsRepository repository,UserRepository users,StatsAdminCache adminCache,Clock clock){this.repository=repository;this.users=users;this.adminCache=adminCache;this.clock=clock;}
 private User require(Long id,Role...roles){
  User u=users.findById(id).orElseThrow(()->new ResourceNotFoundException("Utilisateur introuvable"));
  if(u.isArchived())throw new UnauthorizedException(ErrorCode.ACCOUNT_ARCHIVED,"Ce compte est désactivé");
  if(!Arrays.asList(roles).contains(u.getRole()))throw new ForbiddenException("Ce tableau de bord ne vous est pas accessible");
  return u;
 }
 public static BigDecimal money(BigDecimal amount){return amount.setScale(2,RoundingMode.HALF_UP);}
 public static Kpi kpi(Number current,Number previous){
  BigDecimal value=money(new BigDecimal(current.toString()));
  BigDecimal before=previous==null?null:money(new BigDecimal(previous.toString()));
  BigDecimal change=before==null||before.signum()==0?null:value.subtract(before).multiply(BigDecimal.valueOf(100)).divide(before,2,RoundingMode.HALF_UP);
  return new Kpi(value,before,change);
 }
 public static BigDecimal average(StatsRepository.Totals totals){return totals.confirmedCount()==0?money(BigDecimal.ZERO):totals.revenue().divide(BigDecimal.valueOf(totals.confirmedCount()),2,RoundingMode.HALF_UP);}
 public static OffsetDateTime generated(Clock clock){return clock.instant().atZone(StatsPeriod.ZONE).toOffsetDateTime();}
 public static List<Point> round(List<Point> points){return points.stream().map(p->new Point(p.key(),p.label(),p.bookings(),money(p.revenue()))).toList();}
 public Admin admin(Long actor,String period){require(actor,Role.ADMIN);var p=StatsPeriod.resolve(period,clock);return adminCache.get(p.code());}
 public void authorizeAdmin(Long actor){require(actor,Role.ADMIN);}
 public Supplier supplier(Long actor,String period){
  User u=require(actor,Role.SUPPLIER);var p=StatsPeriod.resolve(period,clock);var prev=p.previous();
  var current=repository.totals(p,actor,null);var before=repository.totals(prev,actor,null);
  LocalDate today=LocalDate.now(clock.withZone(StatsPeriod.ZONE));
  // La carte du mois utilise une vraie période calendaire, indépendamment du sélecteur.
  StatsPeriod month=new StatsPeriod("month",today.withDayOfMonth(1),today.withDayOfMonth(1).plusMonths(1),List.of());
  StatsPeriod lastMonth=new StatsPeriod("month",month.from().minusMonths(1),month.from(),List.of());
  return new Supplier(p.code(),p.from(),p.to(),generated(clock),"Africa/Casablanca","MAD",u.getFullName(),repository.offers(actor),
   kpi(current.count(),before.count()),kpi(repository.totals(month,actor,null).count(),repository.totals(lastMonth,actor,null).count()),
   kpi(current.revenue(),before.revenue()),round(repository.series(StatsPeriod.sixMonths(clock),actor,null)),
   repository.availability(actor,LocalDateTime.now(clock)),repository.recent(p,actor,null,false,LocalDateTime.now(clock)),repository.activities(actor,false));
 }
 public Agent agent(Long actor,String period){
  require(actor,Role.AGENT,Role.ADMIN);var p=StatsPeriod.resolve(period,clock);
  LocalDate today=LocalDate.now(clock.withZone(StatsPeriod.ZONE));
  var cash=repository.cashTotals();
  long current=repository.createdBetween(StatsPeriod.utc(today),StatsPeriod.utc(today.plusDays(1)));
  long previous=repository.createdBetween(StatsPeriod.utc(today.minusDays(1)),StatsPeriod.utc(today));
  return new Agent(p.code(),p.from(),p.to(),generated(clock),"Africa/Casablanca","MAD",
   kpi(repository.statuses(p,null,null).get("PENDING"),repository.statuses(p.previous(),null,null).get("PENDING")),cash.count(),money(cash.amount()),
   new TicketStats(false,0,List.of()),kpi(current,previous),repository.recent(p,null,null,false,LocalDateTime.now(clock)),repository.upcomingCash());
 }
 public Client client(Long actor,String period){
  User user=require(actor,Role.CLIENT);var p=StatsPeriod.resolve(period,clock);var previous=p.previous();
  var next=repository.recent(null,null,actor,true,LocalDateTime.now(clock));
  return new Client(p.code(),p.from(),p.to(),generated(clock),"Africa/Casablanca","MAD",user.getFullName(),next.isEmpty()?null:next.getFirst(),
   repository.recent(p,null,actor,false,LocalDateTime.now(clock)),new UnreadNotifications(true,repository.unread(actor),repository.activities(actor,true)),
   new ClientTotals(repository.totals(null,null,actor).count(),money(repository.spent(null,actor))),
   kpi(repository.totals(p,null,actor).count(),repository.totals(previous,null,actor).count()),
   kpi(repository.spent(p,actor),repository.spent(previous,actor)));
 }
}
