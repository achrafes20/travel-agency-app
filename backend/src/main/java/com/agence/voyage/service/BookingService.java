package com.agence.voyage.service;

import com.agence.voyage.config.BookingModuleProperties;
import com.agence.voyage.dto.*;
import com.agence.voyage.entity.*;
import com.agence.voyage.exception.*;
import com.agence.voyage.repository.*;
import jakarta.persistence.*;
import jakarta.persistence.criteria.*;
import org.slf4j.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.*;
import java.time.*;
import java.util.*;

@Service
@Transactional
public class BookingService {
 private static final Logger log=LoggerFactory.getLogger(BookingService.class);
 private final BookingRepository bookings;
 private final BookingItemRepository items;
 private final BookingAllocationRepository allocations;
 private final OfferAvailabilityRepository periods;
 private final OfferRepository offers;
 private final CartRepository carts;
 private final UserRepository users;
 private final PromoCodeRepository promos;
 private final BookingSequenceRepository sequences;
 private final BookingTravelCriteria criteria;
 private final BookingModuleProperties properties;
 private final Clock clock;
 private final JdbcTemplate jdbc;
 private final EntityManager em;
 private final PaymentLedger paymentLedger;
 private final NotificationEvents notifications;
 public BookingService(BookingRepository bookings,BookingItemRepository items,BookingAllocationRepository allocations,
   OfferAvailabilityRepository periods,OfferRepository offers,CartRepository carts,UserRepository users,
   PromoCodeRepository promos,BookingSequenceRepository sequences,BookingTravelCriteria criteria,
   BookingModuleProperties properties,Clock clock,JdbcTemplate jdbc,EntityManager em,PaymentLedger paymentLedger,NotificationEvents notifications) {
  this.bookings=bookings;this.items=items;this.allocations=allocations;this.periods=periods;this.offers=offers;
  this.carts=carts;this.users=users;this.promos=promos;this.sequences=sequences;this.criteria=criteria;
  this.properties=properties;this.clock=clock;this.jdbc=jdbc;this.em=em;this.paymentLedger=paymentLedger;
  this.notifications=notifications;
 }
 private LocalDateTime now(){return LocalDateTime.now(clock);}
 private BusinessException fail(ErrorCode code,String text){return new BusinessException(code,HttpStatus.CONFLICT,text);}
 private User actor(Long id){return users.findById(id).orElseThrow(()->new ResourceNotFoundException("Utilisateur introuvable"));}
 private static boolean staff(User u){return u.getRole()==Role.ADMIN||u.getRole()==Role.AGENT;}
 private void requireStaff(User u){if(!staff(u))throw new ForbiddenException("Action réservée aux agents et administrateurs");}
 private record Demand(BookingItem item,OfferAvailability availability,int quantity,int people) {}

 public BookingResponse createFromCart(Long clientId,CreateBookingRequest request) {
  User client=actor(clientId);
  if(client.getRole()!=Role.CLIENT)throw new ForbiddenException("Seul un client peut réserver");
  Cart cart=carts.lockByClientId(clientId).orElseThrow(()->fail(ErrorCode.CART_EMPTY,"Votre panier est vide"));
  if(cart.getItems().isEmpty())throw fail(ErrorCode.CART_EMPTY,"Votre panier est vide");
  if(request.paymentMethod()!=PaymentMethod.ONLINE&&request.paymentMethod()!=PaymentMethod.PAY_ON_ARRIVAL)
   throw new BusinessException(ErrorCode.BAD_REQUEST,"Méthode attendue : ONLINE ou PAY_ON_ARRIVAL");
  List<Long> offerIds=cart.getItems().stream().flatMap(i->(i.getOffer()!=null?List.of(i.getOffer()):i.getBundle().getOffers()).stream()).map(Offer::getId).distinct().sorted().toList();
  // Ordre global : panier, offres croissantes, disponibilités croissantes, séquence annuelle.
  for(Offer o:offers.lockAll(offerIds))em.refresh(o,LockModeType.PESSIMISTIC_WRITE);
  Booking booking=new Booking(); booking.setClient(client);booking.setCreatedAt(now());booking.setPaymentMethod(request.paymentMethod());
  booking.setContactPhone(request.contactPhone());booking.setNotes(request.notes());
  List<Demand> demands=new ArrayList<>();BigDecimal subtotal=BigDecimal.ZERO;
  for(CartItem line:cart.getItems()){
   int qty=line.getQuantity();if(qty<1)throw new BusinessException(ErrorCode.BAD_REQUEST,"Quantité invalide");
   BigDecimal price=line.getOffer()!=null?BookingPricing.offer(line.getOffer()):BookingPricing.bundle(line.getBundle());
   BookingItem parent=newItem(booking,line.getOffer(),line.getBundle(),null,qty,price,line.getTravelCriteria());
   subtotal=subtotal.add(parent.getLineTotal());
   if(line.getOffer()!=null) demands.addAll(demand(parent,line.getOffer(),request.paymentMethod()));
   else {
    List<Offer> components=line.getBundle().getOffers().stream().sorted(Comparator.comparing(Offer::getId)).toList();
    if(components.isEmpty())throw fail(ErrorCode.OFFER_INACTIVE,"Ce bundle ne contient aucune offre");
    BigDecimal sum=components.stream().map(BookingPricing::offer).reduce(BigDecimal.ZERO,BigDecimal::add);
    BigDecimal remaining=parent.getUnitPrice();
    for(int i=0;i<components.size();i++){
     Offer o=components.get(i);
     BigDecimal share=i==components.size()-1?remaining:sum.signum()==0?BookingPricing.money(parent.getUnitPrice().divide(BigDecimal.valueOf(components.size()),8,RoundingMode.HALF_UP)):BookingPricing.money(parent.getUnitPrice().multiply(BookingPricing.offer(o)).divide(sum,8,RoundingMode.HALF_UP));
     share=share.min(remaining).max(BigDecimal.ZERO);
     remaining=remaining.subtract(share);
     BookingItem child=newItem(booking,o,null,parent,qty,share,line.getTravelCriteria());
     demands.addAll(demand(child,o,request.paymentMethod()));
    }
    parent.setServiceStartAt(booking.getItems().stream().filter(i->i.getParentItem()==parent).map(BookingItem::getServiceStartAt).min(Comparator.naturalOrder()).orElseThrow());
    parent.setServiceEndAt(booking.getItems().stream().filter(i->i.getParentItem()==parent).map(BookingItem::getServiceEndAt).max(Comparator.naturalOrder()).orElseThrow());
   }
  }
  Map<Long,Integer> quantities=new TreeMap<>(), people=new TreeMap<>();
  for(Demand d:demands){quantities.merge(d.availability().getId(),d.quantity(),Math::addExact);people.merge(d.availability().getId(),d.people(),Math::max);}
  for(OfferAvailability a:periods.lockAll(quantities.keySet())){
   em.refresh(a,LockModeType.PESSIMISTIC_WRITE);
   if(a.getCapacity()<quantities.get(a.getId())||a.getCapacity()<people.get(a.getId())) {
    String title=demands.stream().filter(d->d.availability().getId().equals(a.getId())).findFirst().orElseThrow().item().getTitleSnapshot();
    throw fail(ErrorCode.CAPACITY_EXCEEDED,"Capacité insuffisante pour « "+title+" ». Retournez au panier pour ajuster votre sélection.");
   }
   a.setCapacity(a.getCapacity()-quantities.get(a.getId()));
  }
  PromoCode promo=cart.getPromoCode();
  if(promo!=null){
   promo=promos.findById(promo.getId()).orElseThrow(()->fail(ErrorCode.PROMO_CODE_INVALID,"Code promo introuvable"));
   em.refresh(promo,LockModeType.PESSIMISTIC_WRITE);
   if(!Boolean.TRUE.equals(promo.getActive())||(promo.getExpiryDate()!=null&&promo.getExpiryDate().isBefore(now().toLocalDate())))
    throw fail(ErrorCode.PROMO_CODE_INVALID,"Le code promo a expiré ou n'est plus actif");
   booking.setPromoCode(promo);booking.setPromoCodeSnapshot(promo.getCode());booking.setPromoTypeSnapshot(promo.getDiscountType());booking.setPromoValueSnapshot(promo.getValue());
  }
  booking.setSubtotal(BookingPricing.money(subtotal));booking.setDiscount(BookingPricing.discount(promo,subtotal));booking.setTotal(booking.getSubtotal().subtract(booking.getDiscount()));
  booking.setServiceStartAt(demands.stream().map(d->d.item().getServiceStartAt()).min(Comparator.naturalOrder()).orElseThrow());
  booking.setServiceEndAt(demands.stream().map(d->d.item().getServiceEndAt()).max(Comparator.naturalOrder()).orElseThrow());
  if(request.paymentMethod()==PaymentMethod.PAY_ON_ARRIVAL){booking.setStatus(BookingStatus.CONFIRMED);booking.setConfirmedAt(now());}
  else booking.setExpiresAt(now().plusMinutes(properties.pendingExpirationMinutes()));
  booking.setReference(nextReference());
  for(Demand d:demands){
   BookingItemAllocation allocation=new BookingItemAllocation();allocation.setBookingItem(d.item());allocation.setAvailability(d.availability());allocation.setQuantity(d.quantity());d.item().getAllocations().add(allocation);
  }
  bookings.saveAndFlush(booking);
  paymentLedger.initialize(booking);
  notifications.created(booking);
  if(booking.getStatus()==BookingStatus.CONFIRMED)notifications.confirmed(booking);
  cart.getItems().clear();cart.setPromoCode(null);carts.flush();
  log.info("booking_created reference={} status={}",booking.getReference(),booking.getStatus());
  return response(booking,client,booking.getItems());
 }
 private String nextReference(){
  int year=now().getYear();
  // Upsert atomique : initialise l'année sans écraser une valeur concurrente (MySQL et H2 MODE=MySQL).
  jdbc.update("INSERT INTO booking_sequence(sequence_year,last_value) VALUES (?,0) ON DUPLICATE KEY UPDATE sequence_year=sequence_year",year);
  BookingSequence sequence=sequences.lockYear(year).orElseThrow();
  long next=sequence.getLastValue()+1;
  if(next>999999)throw fail(ErrorCode.CONFLICT,"Séquence annuelle épuisée");
  sequence.setLastValue(next);return String.format(Locale.ROOT,"BK-%d-%06d",year,next);
 }
 private BookingItem newItem(Booking b,Offer o,Bundle bundle,BookingItem parent,int qty,BigDecimal price,String travel){
  BookingItem i=new BookingItem();i.setBooking(b);i.setOffer(o);i.setBundle(bundle);i.setParentItem(parent);i.setSupplier(o==null?null:o.getSupplier());
  i.setTitleSnapshot(o==null?bundle.getTitle():o.getTitle());i.setQuantity(qty);i.setUnitPrice(price);i.setLineTotal(BookingPricing.money(price.multiply(BigDecimal.valueOf(qty))));i.setTravelCriteria(o==null?travel:criteria.scope(o,travel));b.getItems().add(i);return i;
 }
 private List<Demand> demand(BookingItem item,Offer offer,PaymentMethod method){
  if(!Boolean.TRUE.equals(offer.getActive())||offer.getModeratedBy()!=null&&!Boolean.TRUE.equals(offer.getActive()))
   throw fail(ErrorCode.OFFER_INACTIVE,"Offre inactive : "+offer.getTitle());
  if(method==PaymentMethod.PAY_ON_ARRIVAL&&!Boolean.TRUE.equals(offer.getAllowsPayOnArrival()))
   throw fail(ErrorCode.PAY_ON_ARRIVAL_NOT_ALLOWED,"Paiement à l'arrivée indisponible pour « "+offer.getTitle()+" »");
  BookingTravelCriteria.Period p=criteria.parse(offer,item.getTravelCriteria(),now());
  item.setServiceStartAt(p.start());item.setServiceEndAt(p.end());
  List<LocalDateTime[]> requested=new ArrayList<>();
  if(offer instanceof Flight f && Boolean.TRUE.equals(f.getRoundTrip())) {
   requested.add(new LocalDateTime[]{f.getDepartureDateTime(),f.getArrivalDateTime()});
   requested.add(new LocalDateTime[]{f.getReturnDepartureDateTime(),f.getReturnArrivalDateTime()});
  } else requested.add(new LocalDateTime[]{p.start(),p.end()});
  Map<Long,Demand> unique=new LinkedHashMap<>();
  for(LocalDateTime[] range:requested){
   LocalDateTime end=range[1]==null?range[0].plusHours(1):range[1];
   OfferAvailability availability=offer.getAvailabilities().stream().filter(a->!a.getStartAt().isAfter(range[0])&&!a.getEndAt().isBefore(end)).findFirst()
    .orElseThrow(()->fail(ErrorCode.AVAILABILITY_NOT_COVERED,"La période demandée n'est pas couverte pour « "+offer.getTitle()+" »"));
   unique.putIfAbsent(availability.getId(),new Demand(item,availability,item.getQuantity(),offer instanceof Flight||offer instanceof TaxiTransfer||offer instanceof Excursion?p.people():1));
  }
  return new ArrayList<>(unique.values());
 }
 private Booking locked(Long id){return bookings.lockById(id).orElseThrow(()->notFound());}
 private BusinessException notFound(){return new BusinessException(ErrorCode.BOOKING_NOT_FOUND,HttpStatus.NOT_FOUND,"Réservation introuvable");}
 private boolean owns(User u,Booking b){return b.getClient().getId().equals(u.getId());}
 private boolean cancellable(Booking b,User u){
  return (b.getStatus()==BookingStatus.PENDING||b.getStatus()==BookingStatus.CONFIRMED)&&(staff(u)||u.getRole()==Role.CLIENT&&owns(u,b)&&b.getServiceStartAt()!=null&&!now().isAfter(b.getServiceStartAt().minusHours(properties.cancellationDeadlineHours())));
 }
 public BookingResponse cancel(Long actorId,Long id,CancelBookingRequest request){
  User u=actor(actorId);Booking b=locked(id);
  if(!staff(u)&&!(u.getRole()==Role.CLIENT&&owns(u,b)))throw notFound();
  if(b.getStatus()!=BookingStatus.PENDING&&b.getStatus()!=BookingStatus.CONFIRMED)throw fail(ErrorCode.INVALID_BOOKING_STATE,"Cette réservation ne peut plus être annulée");
  String reason=request==null?null:request.reason();
  if(staff(u)&&(reason==null||reason.isBlank()))throw new BusinessException(ErrorCode.VALIDATION_ERROR,"Un motif d'annulation est obligatoire pour les agents et administrateurs");
  if(!cancellable(b,u))throw fail(ErrorCode.CANCELLATION_DEADLINE_PASSED,"L'annulation client est possible jusqu'à "+properties.cancellationDeadlineHours()+" heures avant le début du service");
  restore(b);b.setStatus(BookingStatus.CANCELLED);b.setCancelledAt(now());b.setCancellationReason(reason);b.setCancelledBy(u.getId());b.setExpiresAt(null);
  // Un paiement capturé reste payé jusqu'au remboursement effectif réservé à l'admin.
  paymentLedger.cancelActive(b,u,"CANCELLED");
  notifications.cancelled(b,u.getFullName());
  log.info("booking_cancelled reference={}",b.getReference());return response(b,u,b.getItems());
 }
 public BookingResponse confirm(Long actorId,Long id){
  User u=actor(actorId);requireStaff(u);Booking b=locked(id);
  if(b.getStatus()!=BookingStatus.PENDING)throw fail(ErrorCode.INVALID_BOOKING_STATE,"Seule une réservation en attente peut être confirmée");
  if(b.getPaymentMethod()==PaymentMethod.ONLINE&&!paymentLedger.hasCaptured(b))
   throw fail(ErrorCode.BOOKING_NOT_PAYABLE,"Le paiement en ligne doit être reçu avant la confirmation");
  if(b.getExpiresAt()!=null&&b.getExpiresAt().isBefore(now()))throw fail(ErrorCode.INVALID_BOOKING_STATE,"Le délai de confirmation est expiré");
  b.setStatus(BookingStatus.CONFIRMED);b.setConfirmedAt(now());b.setExpiresAt(null);notifications.confirmed(b);return response(b,u,b.getItems());
 }
 private void restore(Booking booking){
  List<BookingItemAllocation> outstanding=allocations.outstanding(booking.getId());
  Map<Long,Integer> sums=new TreeMap<>();outstanding.forEach(a->sums.merge(a.getAvailability().getId(),a.getQuantity(),Math::addExact));
  if(!sums.isEmpty())for(OfferAvailability a:periods.lockAll(sums.keySet())){em.refresh(a,LockModeType.PESSIMISTIC_WRITE);a.setCapacity(Math.addExact(a.getCapacity(),sums.get(a.getId())));}
  outstanding.forEach(a->a.setRestored(true));
 }
 public boolean expire(Long id){
  Booking b=locked(id);
  if(b.getStatus()!=BookingStatus.PENDING||b.getPaymentMethod()!=PaymentMethod.ONLINE||paymentLedger.hasCaptured(b)||b.getExpiresAt()==null||!b.getExpiresAt().isBefore(now()))return false;
  restore(b);b.setStatus(BookingStatus.EXPIRED);paymentLedger.cancelActive(b,null,"EXPIRED");log.info("booking_expired reference={}",b.getReference());return true;
 }
 public void cancelAfterRefund(Booking b,User admin,String reason){
  if(admin!=null&&admin.getRole()!=Role.ADMIN)throw new ForbiddenException("Remboursement réservé aux administrateurs");
  if(b.getStatus()==BookingStatus.CANCELLED||b.getStatus()==BookingStatus.EXPIRED)return;
  restore(b);b.setStatus(BookingStatus.CANCELLED);b.setCancelledAt(now());b.setCancelledBy(admin==null?null:admin.getId());
  b.setCancellationReason(reason);b.setExpiresAt(null);
  notifications.cancelled(b,admin==null?"Système de remboursement":admin.getFullName());
 }
 @org.springframework.cache.annotation.CacheEvict(cacheNames="adminStats",allEntries=true)
 public boolean complete(Long id){
  Booking b=locked(id);
  if(b.getStatus()!=BookingStatus.CONFIRMED||b.getServiceEndAt()==null||!b.getServiceEndAt().isBefore(now()))return false;
  b.setStatus(BookingStatus.COMPLETED);return true;
 }
 @Transactional(readOnly=true)
 public BookingResponse get(Long actorId,Long id){
  User u=actor(actorId);Booking b=bookings.findById(id).orElseThrow(()->notFound());
  List<BookingItem> lines=items.findByBookingIdIn(List.of(id));
  if(!staff(u)&&!(u.getRole()==Role.CLIENT&&owns(u,b))&&!(u.getRole()==Role.SUPPLIER&&lines.stream().anyMatch(i->i.getSupplier()!=null&&i.getSupplier().getId().equals(u.getId()))))throw notFound();
  return response(b,u,lines);
 }
 public record Filters(BookingStatus status,PaymentStatus paymentStatus,LocalDate from,LocalDate to,String reference,String client,Long supplierId,String search){}
 @Transactional(readOnly=true)
 public PageResponse<BookingSummaryResponse> list(Long actorId,String scope,Filters f,int page,int size,String sort) {
  if(f.from()!=null&&f.to()!=null&&f.from().isAfter(f.to()))throw new BusinessException(ErrorCode.BAD_REQUEST,"La date de fin doit suivre la date de début");
  User u=actor(actorId);
  if(scope.equals("admin"))requireStaff(u);
  else if(scope.equals("supplier")&&u.getRole()!=Role.SUPPLIER)throw new ForbiddenException("Espace fournisseur requis");
  else if(scope.equals("client")&&u.getRole()!=Role.CLIENT)throw new ForbiddenException("Espace client requis");
  String normalized=PaginationSupport.sort(sort==null?"createdAt,desc":sort,Set.of("id","reference","createdAt","serviceStartAt","total","status"));
  String[] parts=normalized.split(",");
  Specification<Booking> specification=(root,query,cb)->{
   List<Predicate> where=new ArrayList<>();
   if(scope.equals("client"))where.add(cb.equal(root.get("client").get("id"),u.getId()));
   Long supplier=scope.equals("supplier")?u.getId():f.supplierId();
   if(supplier!=null){
    Subquery<Long> sub=query.subquery(Long.class);Root<BookingItem> i=sub.from(BookingItem.class);sub.select(i.get("booking").get("id")).where(cb.equal(i.get("supplier").get("id"),supplier));where.add(root.get("id").in(sub));
   }
   if(f.status()!=null)where.add(cb.equal(root.get("status"),f.status()));
   if(f.paymentStatus()!=null)where.add(cb.equal(root.get("paymentStatus"),f.paymentStatus()));
   if(f.from()!=null)where.add(cb.greaterThanOrEqualTo(root.get("createdAt"),f.from().atStartOfDay()));
   if(f.to()!=null)where.add(cb.lessThan(root.get("createdAt"),f.to().plusDays(1).atStartOfDay()));
   if(f.reference()!=null&&!f.reference().isBlank())where.add(cb.like(cb.lower(root.get("reference")),like(f.reference())));
   if(f.client()!=null&&!f.client().isBlank())where.add(cb.or(cb.like(cb.lower(root.get("client").get("email")),like(f.client())),cb.like(cb.lower(root.get("client").get("fullName")),like(f.client()))));
   if(f.search()!=null&&!f.search().isBlank())where.add(cb.or(cb.like(cb.lower(root.get("reference")),like(f.search())),cb.like(cb.lower(root.get("client").get("fullName")),like(f.search()))));
   return cb.and(where.toArray(Predicate[]::new));
  };
  Page<Booking> result=bookings.findAll(specification,PageRequest.of(PaginationSupport.page(page),PaginationSupport.size(size),Sort.by(Sort.Direction.fromString(parts[1]),parts[0]).and(Sort.by("id"))));
  Map<Long,List<BookingItem>> grouped=new HashMap<>();
  if(!result.isEmpty())for(BookingItem i:items.findByBookingIdIn(result.map(Booking::getId).getContent()))grouped.computeIfAbsent(i.getBooking().getId(),k->new ArrayList<>()).add(i);
  List<BookingSummaryResponse> views=result.getContent().stream().map(b->{
   BookingResponse r=response(b,u,grouped.getOrDefault(b.getId(),List.of()));
   return new BookingSummaryResponse(r.id(),r.reference(),r.clientName(),r.clientEmail(),r.status(),r.paymentStatus(),r.paymentMethod(),r.total(),r.currency(),r.createdAt(),r.serviceStartAt(),r.serviceEndAt(),r.canCancel(),r.voucherAvailable(),u.getRole()==Role.CLIENT&&b.getStatus()==BookingStatus.PENDING&&b.getPaymentMethod()==PaymentMethod.ONLINE&&b.getExpiresAt()!=null&&!b.getExpiresAt().isBefore(now()));
  }).toList();
  return new PageResponse<>(views,result.getNumber(),result.getSize(),result.getTotalElements(),normalized);
 }
 private static String like(String value){return "%"+value.trim().toLowerCase(Locale.ROOT).replace("%","\\%").replace("_","\\_")+"%";}
 private BookingResponse response(Booking b,User u,List<BookingItem> all){
  boolean scoped=u.getRole()==Role.SUPPLIER;
  List<BookingItem> selected=scoped?all.stream().filter(i->i.getSupplier()!=null&&i.getSupplier().getId().equals(u.getId())).toList():all;
  BigDecimal sub=scoped?selected.stream().map(BookingItem::getLineTotal).reduce(BigDecimal.ZERO,BigDecimal::add):b.getSubtotal();
  BigDecimal discount=scoped?(b.getSubtotal().signum()==0?BigDecimal.ZERO:BookingPricing.money(b.getDiscount().multiply(sub).divide(b.getSubtotal(),8,RoundingMode.HALF_UP))):b.getDiscount();
  List<BookingItemResponse> views=selected.stream().map(i->new BookingItemResponse(i.getId(),scoped?null:i.getParentItem()==null?null:i.getParentItem().getId(),i.getOffer()==null?null:i.getOffer().getId(),i.getBundle()==null?null:i.getBundle().getId(),i.getSupplier()==null?null:i.getSupplier().getId(),i.getTitleSnapshot(),i.getQuantity(),i.getUnitPrice(),i.getLineTotal(),i.getTravelCriteria(),i.getServiceStartAt(),i.getServiceEndAt())).toList();
  LocalDateTime start=scoped?selected.stream().map(BookingItem::getServiceStartAt).min(Comparator.naturalOrder()).orElse(null):b.getServiceStartAt();
  LocalDateTime end=scoped?selected.stream().map(BookingItem::getServiceEndAt).max(Comparator.naturalOrder()).orElse(null):b.getServiceEndAt();
  boolean voucher=!scoped&&(b.getStatus()==BookingStatus.CONFIRMED||b.getStatus()==BookingStatus.COMPLETED);
  return new BookingResponse(b.getId(),b.getReference(),b.getStatus(),b.getPaymentStatus(),b.getPaymentMethod(),b.getClient().getFullName(),scoped?null:b.getClient().getEmail(),BookingPricing.money(sub),BookingPricing.money(discount),BookingPricing.money(sub.subtract(discount)),b.getCurrency(),scoped?null:b.getPromoCodeSnapshot(),scoped?null:b.getPromoTypeSnapshot(),scoped?null:b.getPromoValueSnapshot(),b.getCreatedAt(),b.getConfirmedAt(),b.getCancelledAt(),scoped?null:b.getCancellationReason(),scoped?null:b.getCancelledBy(),b.getExpiresAt(),start,end,cancellable(b,u),voucher,scoped,views,!scoped&&all.stream().anyMatch(i->i.getOffer()!=null)&&all.stream().filter(i->i.getOffer()!=null).allMatch(i->Boolean.TRUE.equals(i.getOffer().getAllowsPayOnArrival())));
 }
}

