package com.agence.voyage.entity;
import jakarta.persistence.*;
@Entity @Table(name="notification_preferences")
public class NotificationPreference {
 @Id @Column(name="user_id") private Long userId;
 private boolean emailEnabled=true;
 private boolean inAppEnabled=true;
 private boolean bookingEmail=true;
 private boolean paymentEmail=true;
 private boolean offerEmail=true;
 private boolean supportEmail=true;
 public Long getUserId(){return userId;}
 public void setUserId(Long id){userId=id;}
 public boolean isEmailEnabled(){return emailEnabled;}
 public void setEmailEnabled(boolean value){emailEnabled=value;}
 public boolean isInAppEnabled(){return inAppEnabled;}
 public void setInAppEnabled(boolean value){inAppEnabled=value;}
 public boolean isBookingEmail(){return bookingEmail;}
 public void setBookingEmail(boolean value){bookingEmail=value;}
 public boolean isPaymentEmail(){return paymentEmail;}
 public void setPaymentEmail(boolean value){paymentEmail=value;}
 public boolean isOfferEmail(){return offerEmail;}
 public void setOfferEmail(boolean value){offerEmail=value;}
 public boolean isSupportEmail(){return supportEmail;}
 public void setSupportEmail(boolean value){supportEmail=value;}
 public boolean allowsEmail(NotificationCategory category) {
  if(category==NotificationCategory.ACCOUNT)return true;
  return emailEnabled && switch(category) {
   case BOOKING -> bookingEmail; case PAYMENT -> paymentEmail;
   case OFFER -> offerEmail; case SUPPORT -> supportEmail; default -> true;
  };
 }
}
