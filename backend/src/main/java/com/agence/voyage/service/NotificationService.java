package com.agence.voyage.service;

import com.agence.voyage.config.*;
import com.agence.voyage.dto.*;
import com.agence.voyage.entity.*;
import com.agence.voyage.event.EmailNotificationEvent;
import com.agence.voyage.exception.*;
import com.agence.voyage.repository.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.slf4j.*;
import java.time.*;
import java.net.URI;
import java.util.*;

@Service
public class NotificationService {
 private static final Logger log=LoggerFactory.getLogger(NotificationService.class);
 private final NotificationRepository notifications;
 private final NotificationPreferenceRepository preferences;
 private final NotificationDispatchRepository dispatches;
 private final UserRepository users;
 private final ApplicationEventPublisher publisher;
 private final Clock clock;
 private final NotificationProperties properties;
 private final FrontendProperties frontend;
 private final TransactionTemplate newTransaction;
 public NotificationService(NotificationRepository notifications,NotificationPreferenceRepository preferences,
  NotificationDispatchRepository dispatches,UserRepository users,ApplicationEventPublisher publisher,Clock clock,
  NotificationProperties properties,FrontendProperties frontend,PlatformTransactionManager manager){
  this.notifications=notifications;this.preferences=preferences;this.dispatches=dispatches;this.users=users;
  this.publisher=publisher;this.clock=clock;this.properties=properties;this.frontend=frontend;
  newTransaction=new TransactionTemplate(manager);
  newTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
 }
 private LocalDateTime now(){return LocalDateTime.now(clock);}
 private NotificationPreference defaults(Long id){var p=new NotificationPreference();p.setUserId(id);return p;}
 private NotificationPreference preference(Long id){return preferences.findById(id).orElseGet(()->defaults(id));}

 /**
  * Création directe d'une notification dans la transaction courante (ex. module Support / Tickets).
  */
 @Transactional
 public Notification create(User user, NotificationType type, String title, String message, String link) {
  if (user == null || user.isArchived()) return null;
  NotificationLinks.validate(link);
  Notification n = new Notification();
  n.setUser(user);
  n.setType(type != null ? type : NotificationType.TICKET_REPLY);
  n.setTitle(title != null && title.length() > 150 ? title.substring(0, 150) : title);
  n.setMessage(message != null && message.length() > 1000 ? message.substring(0, 1000) : message);
  n.setLink(link);
  n.setIsRead(false);
  n.setCreatedAt(now());
  return notifications.save(n);
 }

 /** Une transaction indépendante par destinataire, après le commit métier. */
 public NotificationResponse notify(Long userId,NotificationType type,String title,String message,String link,
  String referenceType,Long referenceId,String dedupKey){
  NotificationLinks.validate(link);
  if(type==null||title==null||title.isBlank()||title.length()>150||message==null||message.length()>1000
    ||dedupKey!=null&&dedupKey.length()>200||referenceType!=null&&referenceType.length()>50)
   throw new BusinessException("Contenu de notification invalide");
  try{return newTransaction.execute(status->create(userId,type,title,message,link,referenceType,referenceId,dedupKey));}
  catch(DataIntegrityViolationException duplicate){log.debug("notification_duplicate_or_conflict userId={}",userId);return null;}
 }
 private NotificationResponse create(Long userId,NotificationType type,String title,String message,String link,
  String referenceType,Long referenceId,String key){
  User user=users.lockNotificationRecipient(userId).orElse(null);
  if(user==null||user.isArchived())return null;
  String dispatchKey=key==null?"manual:"+UUID.randomUUID():key;
  if(dispatches.existsByUserIdAndDedupKey(userId,dispatchKey)
     ||key!=null&&notifications.existsByUserIdAndDedupKey(userId,key))return null;
  dispatches.saveAndFlush(new NotificationDispatch(userId,dispatchKey,now()));
  var preference=preference(userId);
  NotificationResponse response=null;
  if(preference.isInAppEnabled()){
   Notification n=new Notification();n.setUser(user);n.setType(type);n.setTitle(title);n.setMessage(message);
   n.setLink(link);n.setReferenceType(referenceType);n.setReferenceId(referenceId);n.setDedupKey(key);n.setCreatedAt(now());
   response=NotificationResponse.from(notifications.saveAndFlush(n));
  }
  if(preference.allowsEmail(type.getCategory())){
   String template=switch(type){
    case ACCOUNT_WELCOME -> "welcome";case BOOKING_CONFIRMED -> "booking";
    case BOOKING_CANCELLED -> "cancellation";case PAYMENT_RECEIVED -> "payment";default -> "generic";
   };
   String role=user.getRole().name().toLowerCase(Locale.ROOT);
   String preferencesUrl=frontend.baseUrl().replaceAll("/$","")+"/"+role+"/index.html?page=notifications#preferences";
   String local=link==null?"":link.startsWith("/frontend/")?link.substring(10):link.startsWith("frontend/")?link.substring(9):link;
   String target=link==null?"":URI.create(frontend.baseUrl().replaceAll("/$","")+"/").resolve(local).toString();
   publisher.publishEvent(new EmailNotificationEvent(user.getEmail(),title,template,
    Map.of("title",title,"message",message,"name",user.getFullName()==null?"":user.getFullName(),
     "link",target,"preferencesUrl",preferencesUrl)));
  }
  return response;
 }
 public void notifyMany(Collection<Long> userIds,NotificationType type,String title,String message,String link,
  String referenceType,Long referenceId,String dedupKey){
  userIds.stream().filter(Objects::nonNull).distinct().sorted().forEach(id->{
   try{notify(id,type,title,message,link,referenceType,referenceId,dedupKey);}
   catch(RuntimeException ex){log.warn("notification_failed userId={} type={}",id,type);}
  });
 }
 @Transactional(readOnly=true)
 public PageResponse<NotificationResponse> list(Long userId,Boolean read,NotificationCategory category,
  NotificationType type,int page,int size){
  Specification<Notification> spec=(root,q,cb)->{
   var predicates=new ArrayList<jakarta.persistence.criteria.Predicate>();
   predicates.add(cb.equal(root.get("user").get("id"),userId));
   if(read!=null)predicates.add(cb.equal(root.get("isRead"),read));
   if(type!=null)predicates.add(cb.equal(root.get("type"),type));
   if(category!=null)predicates.add(root.get("type").in(Arrays.stream(NotificationType.values()).filter(t->t.getCategory()==category).toList()));
   return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
  };
  var result=notifications.findAll(spec,PageRequest.of(Math.max(0,page),Math.max(1,Math.min(50,size)),
   Sort.by(Sort.Direction.DESC,"createdAt").and(Sort.by(Sort.Direction.DESC,"id"))));
  return new PageResponse<>(result.map(NotificationResponse::from).toList(),result.getNumber(),result.getSize(),
   result.getTotalElements(),"createdAt,desc");
 }
 @Transactional(readOnly=true)
 public long unreadCount(Long userId){return notifications.countByUserIdAndIsReadFalse(userId);}
 private Notification owned(Long userId,Long id){return notifications.findByIdAndUserId(id,userId)
  .orElseThrow(()->new BusinessException(ErrorCode.NOT_FOUND,HttpStatus.NOT_FOUND,"Notification introuvable"));}
 @Transactional
 public NotificationResponse markRead(Long userId,Long id){
  var n=owned(userId,id);if(!Boolean.TRUE.equals(n.getIsRead())){n.setIsRead(true);n.setReadAt(now());}
  return NotificationResponse.from(n);
 }
 @Transactional
 public int markAllRead(Long userId){return notifications.markAll(userId,now());}
 @Transactional
 public void delete(Long userId,Long id){notifications.delete(owned(userId,id));}
 @Transactional(readOnly=true)
 public NotificationPreferenceResponse preferences(Long userId){return NotificationPreferenceResponse.from(preference(userId));}
 @Transactional
 public NotificationPreferenceResponse updatePreferences(Long userId,NotificationPreferenceRequest request){
  users.lockNotificationRecipient(userId).orElseThrow(()->new ResourceNotFoundException("Utilisateur introuvable"));
  var p=preference(userId);p.setEmailEnabled(request.emailEnabled());p.setInAppEnabled(request.inAppEnabled());
  p.setBookingEmail(request.bookingEmail());p.setPaymentEmail(request.paymentEmail());
  p.setOfferEmail(request.offerEmail());p.setSupportEmail(request.supportEmail());
  return NotificationPreferenceResponse.from(preferences.save(p));
 }
 @Transactional
 public int purgeOld(){return notifications.purge(now().minusDays(properties.retentionDays()),now().minusDays(properties.readRetentionDays()));}
}
