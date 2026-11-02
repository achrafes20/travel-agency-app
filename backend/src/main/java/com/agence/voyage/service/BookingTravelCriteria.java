package com.agence.voyage.service;

import com.agence.voyage.entity.*;
import com.agence.voyage.exception.*;
import com.fasterxml.jackson.databind.*;
import org.springframework.stereotype.Component;
import java.time.*;
import java.util.*;

/** Normalise les noms de champs déjà utilisés par le catalogue, sans accepter des dates implicites. */
@Component
public class BookingTravelCriteria {
 private final ObjectMapper mapper;
 public BookingTravelCriteria(ObjectMapper mapper){this.mapper=mapper;}
 public record Period(LocalDateTime start,LocalDateTime end,int people) {}
 public String scope(Offer offer,String json) {
  try {
   JsonNode n=mapper.readTree(json==null?"{}":json);
   JsonNode own=n.path("offers").path(String.valueOf(offer.getId()));
   if(own.isObject())return mapper.writeValueAsString(own);
   if(n.isObject())((com.fasterxml.jackson.databind.node.ObjectNode)n).remove("offers");
   return mapper.writeValueAsString(n);
  } catch(Exception e){throw invalid();}
 }
 public Period parse(Offer offer,String json,LocalDateTime now) {
  try {
   JsonNode n=mapper.readTree(json==null?"{}":json);
   if(!n.isObject()) throw invalid();
   // Un bundle peut fournir des critères propres à chaque offre via offers.<id>.
   JsonNode own=n.path("offers").path(String.valueOf(offer.getId())); if(own.isObject()) n=own;
   String start=value(n,"startDate","start","hotelArrival","flightDepart","pickupDate","taxiDeparture","excursionDate","departDate","dateFrom","date");
   String end=value(n,"endDate","end","hotelDeparture","flightReturn","returnDate","taxiReturn","dateTo");
   LocalDateTime from=date(start,value(n,"pickupTime","departureTime"));
   LocalDateTime until=end.isBlank()?from:date(end,value(n,"returnTime"));
   int people=integer(n,1,"travelers","voyageurs","passengers","participants","hotelAdults","adults");
   if(people<1||people>1000) throw invalid();
   if(offer instanceof Hotel) {
    if(end.isBlank()||!until.isAfter(from)) throw invalid();
   } else if(offer instanceof Car car) {
    if(end.isBlank()||!until.isAfter(from)) throw invalid();
    String ageText=value(n,"driverAge","age");
    int age="30-65".equals(ageText)?30:Integer.parseInt(ageText);
    if(age<(car.getMinimumDriverAge()==null?21:car.getMinimumDriverAge())||age>(car.getMaximumDriverAge()==null?75:car.getMaximumDriverAge())) throw invalid();
    String pickup=value(n,"pickup","pickupLocation"), drop=value(n,"dropoff","dropoffLocation");
    if(pickup.isBlank()) throw invalid();
    if(car.getPickupLocation()!=null&&!same(pickup,car.getPickupLocation()) && (car.getCity()==null||!same(pickup,car.getCity().getName()))) throw invalid();
    if(drop.isBlank())drop=pickup;
    String destination=drop;
    if(!same(pickup,drop)&&(!Boolean.TRUE.equals(car.getAllowsDifferentDropoff())||car.getDropoffLocations().stream().noneMatch(d->same(d,destination)))) throw invalid();
   } else if(offer instanceof Flight f) {
    if(f.getDepartureDateTime()==null||!from.toLocalDate().equals(f.getDepartureDateTime().toLocalDate())) throw invalid();
    boolean round="round".equals(value(n,"trip"))||"true".equals(value(n,"roundTrip"));
    if(round!=Boolean.TRUE.equals(f.getRoundTrip())) throw invalid();
    String cabin=value(n,"cabinClass","cabin","travelClass");
    if(cabin.isBlank()) cabin="business".equals(value(n,"passengers"))?"BUSINESS":"ECONOMY";
    if(f.getCabinClass()!=null&&!cabin.equalsIgnoreCase(f.getCabinClass()))throw invalid();
    from=f.getDepartureDateTime();
    until=f.getArrivalDateTime()==null?from.plusHours(1):f.getArrivalDateTime();
    if(round) {
     if(end.isBlank()||f.getReturnDepartureDateTime()==null||!date(end,"").toLocalDate().equals(f.getReturnDepartureDateTime().toLocalDate()))throw invalid();
     until=f.getReturnArrivalDateTime()==null?f.getReturnDepartureDateTime().plusHours(1):f.getReturnArrivalDateTime();
    }
   } else if(offer instanceof Excursion e) {
    if(start.length()==10) {
     LocalDate day=from.toLocalDate();
     from=offer.getAvailabilities().stream().filter(a->a.getStartAt().toLocalDate().equals(day)).map(OfferAvailability::getStartAt).findFirst().orElse(from);
    }
    until=from.plusHours(e.getDurationHours()==null?1:e.getDurationHours());
   } else if(offer instanceof TaxiTransfer) {
    if(until.equals(from)) until=from.plusHours(1);
    else until=until.plusHours(1);
   }
   if(from.isBefore(now)||until.isBefore(from))throw invalid();
   return new Period(from,until,people);
  } catch(BusinessException e){throw e;} catch(Exception e){throw invalid();}
 }
 private static int integer(JsonNode n,int fallback,String...keys) {
  String s=value(n,keys);if(s.isBlank())return fallback;if(s.equals("business"))return 1;return Integer.parseInt(s);
 }
 private static String value(JsonNode n,String...keys){for(String k:keys){String v=n.path(k).asText("").trim();if(!v.isEmpty())return v;}return "";}
 private static LocalDateTime date(String s,String time) {
  if(s.length()==10)return LocalDate.parse(s).atTime(time.isBlank()?LocalTime.MIDNIGHT:LocalTime.parse(time));
  return LocalDateTime.parse(s);
 }
 private static boolean same(String a,String b){return a.trim().equalsIgnoreCase(b.trim());}
 private static BusinessException invalid(){return new BusinessException(ErrorCode.INVALID_TRAVEL_CRITERIA,"Critères de voyage manquants ou incohérents : vérifiez les dates, voyageurs et conditions de l'offre");}
}

