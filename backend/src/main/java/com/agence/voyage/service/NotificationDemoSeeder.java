package com.agence.voyage.service;
import com.agence.voyage.entity.*;
import com.agence.voyage.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.List;
@Service
public class NotificationDemoSeeder {
 private final UserRepository users;private final NotificationRepository notifications;
 private final NotificationPreferenceRepository preferences;private final NotificationDispatchRepository dispatches;private final Clock clock;
 public NotificationDemoSeeder(UserRepository users,NotificationRepository notifications,NotificationPreferenceRepository preferences,
 NotificationDispatchRepository dispatches,Clock clock){this.users=users;this.notifications=notifications;this.preferences=preferences;this.dispatches=dispatches;this.clock=clock;}
 @Transactional
 public void seed(){
  for(String email:List.of("sarah.benali@example.com","karim.idrissi@atlasvoyage.ma","vols@atlasvoyage.ma",
   "voitures@atlasvoyage.ma","transferts@atlasvoyage.ma","excursions@atlasvoyage.ma","nadia.elfassi@atlasvoyage.ma","omar.tazi@atlasvoyage.ma")){
   User user=users.findByEmailIgnoreCase(email).orElse(null);if(user==null||user.isArchived())continue;
   if(!preferences.existsById(user.getId())){var p=new NotificationPreference();p.setUserId(user.getId());preferences.save(p);}
   for(int index=0;index<2;index++){
    String key="demo:notifications:"+user.getId()+":"+index;
    if(dispatches.existsByUserIdAndDedupKey(user.getId(),key)||notifications.existsByUserIdAndDedupKey(user.getId(),key))continue;
    LocalDateTime at=LocalDateTime.now(clock).minusHours(index==0?2:28);
    Notification n=new Notification();n.setUser(user);n.setCreatedAt(at);n.setDedupKey(key);
    n.setType(index==0?NotificationType.ACCOUNT_WELCOME:NotificationType.SYSTEM);
    n.setTitle(index==0?"Bienvenue dans votre espace Atlas Voyage":"Vos préférences de notification");
    n.setMessage(index==0?"Démonstration : retrouvez ici les informations de votre compte et de vos voyages.":
     "Démonstration : choisissez les catégories d'e-mails que vous souhaitez recevoir.");
    n.setLink("/frontend/"+user.getRole().name().toLowerCase(java.util.Locale.ROOT)+"/index.html?page=notifications");
    n.setIsRead(index==1);if(index==1)n.setReadAt(at.plusHours(1));
    notifications.save(n);dispatches.save(new NotificationDispatch(user.getId(),key,at));
   }
  }
 }
}
