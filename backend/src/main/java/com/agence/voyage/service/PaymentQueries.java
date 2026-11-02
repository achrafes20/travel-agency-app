package com.agence.voyage.service;
import com.agence.voyage.dto.*;
import com.agence.voyage.entity.*;
import com.agence.voyage.repository.*;
import com.agence.voyage.exception.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.util.*;

@Service @Transactional(readOnly=true)
public class PaymentQueries {
 private final PaymentRepository payments;private final UserRepository users;private final BookingRepository bookings;private final PaymentEventRepository events;
 public PaymentQueries(PaymentRepository payments,UserRepository users,BookingRepository bookings,PaymentEventRepository events){this.payments=payments;this.users=users;this.bookings=bookings;this.events=events;}
 private User actor(Long id){return users.findById(id).orElseThrow(()->new ResourceNotFoundException("Utilisateur introuvable"));}
 private void accessible(User u,Booking b){
  if(u.getRole()==Role.SUPPLIER||u.getRole()==Role.CLIENT&&!b.getClient().getId().equals(u.getId()))
   throw new BusinessException(ErrorCode.PAYMENT_NOT_FOUND,HttpStatus.NOT_FOUND,"Paiement introuvable");
 }
 public PaymentResponse get(Long userId,Long id){
  User u=actor(userId);Payment p=payments.findById(id).orElseThrow(()->new BusinessException(ErrorCode.PAYMENT_NOT_FOUND,HttpStatus.NOT_FOUND,"Paiement introuvable"));
  accessible(u,p.getBooking());return PaymentResponse.from(p);
 }
 public List<PaymentResponse> forBooking(Long userId,Long bookingId){
  User u=actor(userId);Booking b=bookings.findById(bookingId).orElseThrow(()->new BusinessException(ErrorCode.PAYMENT_NOT_FOUND,HttpStatus.NOT_FOUND,"Réservation introuvable"));
  accessible(u,b);return payments.findByBookingIdOrderByIdAsc(bookingId).stream().map(PaymentResponse::from).toList();
 }
 public List<PaymentEventResponse> events(Long userId,Long id){get(userId,id);return events.findByPaymentIdOrderByIdAsc(id).stream().map(PaymentEventResponse::from).toList();}
 public record Filters(PaymentStatus status,PaymentMethod method,LocalDate from,LocalDate to,String search){}
 public PageResponse<PaymentResponse> list(Long userId,String scope,Filters filters,int page,int size,String order){
  User user=actor(userId);boolean staff=user.getRole()==Role.AGENT||user.getRole()==Role.ADMIN;
  if(scope.equals("mine")&&user.getRole()!=Role.CLIENT||!scope.equals("mine")&&!staff)throw new ForbiddenException("Cet espace de paiements ne vous est pas accessible");
  if(filters.from()!=null&&filters.to()!=null&&filters.from().isAfter(filters.to()))throw new BusinessException(ErrorCode.BAD_REQUEST,"La date de fin doit suivre la date de début");
  String sort=PaginationSupport.sort(order==null?"createdAt,desc":order,Set.of("id","createdAt","paidAt","amount","status"));
  Specification<Payment> spec=(root,q,cb)->{
   List<Predicate> where=new ArrayList<>();
   if(scope.equals("mine"))where.add(cb.equal(root.get("client").get("id"),userId));
   if(scope.startsWith("cash")){
    where.add(cb.equal(root.get("method"),PaymentMethod.CASH_ON_ARRIVAL));
    if(scope.equals("cash-pending")){
     where.add(cb.equal(root.get("status"),PaymentStatus.PENDING));
     where.add(cb.equal(root.get("booking").get("status"),BookingStatus.CONFIRMED));
    }else{
     where.add(cb.isNotNull(root.get("collectedBy")));if(user.getRole()==Role.AGENT)where.add(cb.equal(root.get("collectedBy").get("id"),userId));
    }
   }
   if(filters.status()!=null)where.add(cb.equal(root.get("status"),filters.status()));
   if(filters.method()!=null)where.add(cb.equal(root.get("method"),filters.method()));
   if(filters.from()!=null)where.add(cb.greaterThanOrEqualTo(root.get("createdAt"),filters.from().atStartOfDay()));
   if(filters.to()!=null)where.add(cb.lessThan(root.get("createdAt"),filters.to().plusDays(1).atStartOfDay()));
   if(filters.search()!=null&&!filters.search().isBlank()){
    String term="%"+filters.search().toLowerCase(Locale.ROOT).replace("%","\\%").replace("_","\\_")+"%";
    where.add(cb.or(cb.like(cb.lower(root.get("booking").get("reference")),term),cb.like(cb.lower(root.get("client").get("fullName")),term)));
   }
   return cb.and(where.toArray(Predicate[]::new));
  };
  var parts=sort.split(",");Page<Payment> result=payments.findAll(spec,PageRequest.of(PaginationSupport.page(page),PaginationSupport.size(size),Sort.by(Sort.Direction.fromString(parts[1]),parts[0]).and(Sort.by("id"))));
  return new PageResponse<>(result.stream().map(PaymentResponse::from).toList(),result.getNumber(),result.getSize(),result.getTotalElements(),sort);
 }
}

