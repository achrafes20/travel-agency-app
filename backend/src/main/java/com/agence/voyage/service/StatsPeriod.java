package com.agence.voyage.service;
import com.agence.voyage.exception.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
/** Les limites Casablanca sont calculées en Java, sans tables timezone MySQL. */
public record StatsPeriod(String code,LocalDate from,LocalDate until,List<Bucket> buckets) {
 public static final ZoneId ZONE=ZoneId.of("Africa/Casablanca");
 public record Bucket(String key,String label,LocalDate from,LocalDate until){}
 public StatsPeriod{buckets=List.copyOf(buckets);}
 public static StatsPeriod resolve(String code,Clock clock){
  String selected=code==null?"30d":code;
  if(!Set.of("7d","30d","12m").contains(selected))throw new BusinessException(ErrorCode.BAD_REQUEST,"Période attendue : 7d, 30d ou 12m");
  LocalDate today=LocalDate.now(clock.withZone(ZONE));
  LocalDate start=selected.equals("12m")?today.withDayOfMonth(1).minusMonths(11):today.minusDays(selected.equals("7d")?6:29);
  LocalDate end=selected.equals("12m")?today.withDayOfMonth(1).plusMonths(1):today.plusDays(1);
  return build(selected,start,end,selected.equals("12m"));
 }
 private static StatsPeriod build(String code,LocalDate from,LocalDate until,boolean monthly){
  List<Bucket> points=new ArrayList<>();
  for(LocalDate date=from;date.isBefore(until);date=monthly?date.plusMonths(1):date.plusDays(1)){
   LocalDate next=monthly?date.plusMonths(1):date.plusDays(1);
   points.add(new Bucket(monthly?YearMonth.from(date).toString():date.toString(),
    date.format(DateTimeFormatter.ofPattern(monthly?"MMM yyyy":"dd MMM",Locale.FRENCH)),date,next));
  }
  return new StatsPeriod(code,from,until,points);
 }
 public StatsPeriod previous(){
  if(code.equals("12m"))return build(code,from.minusMonths(12),from,true);
  long days=java.time.temporal.ChronoUnit.DAYS.between(from,until);return build(code,from.minusDays(days),from,false);
 }
 public static StatsPeriod sixMonths(Clock clock){
  LocalDate month=LocalDate.now(clock.withZone(ZONE)).withDayOfMonth(1);
  return build("6m",month.minusMonths(5),month.plusMonths(1),true);
 }
 public static LocalDateTime utc(LocalDate date){return date.atStartOfDay(ZONE).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();}
 public LocalDateTime startUtc(){return utc(from);}
 public LocalDateTime endUtc(){return utc(until);}
 public LocalDate to(){return until.minusDays(1);}
}
