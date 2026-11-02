package com.agence.voyage.entity;
public enum NotificationType {
 BOOKING_CREATED(NotificationCategory.BOOKING), BOOKING_CONFIRMED(NotificationCategory.BOOKING),
 BOOKING_CANCELLED(NotificationCategory.BOOKING), PAYMENT_RECEIVED(NotificationCategory.PAYMENT),
 PAYMENT_FAILED(NotificationCategory.PAYMENT), AVAILABILITY_LOW(NotificationCategory.OFFER),
 AVAILABILITY_EXPIRED(NotificationCategory.OFFER), OFFER_DEACTIVATED(NotificationCategory.OFFER),
 OFFER_REACTIVATED(NotificationCategory.OFFER), TICKET_REPLY(NotificationCategory.SUPPORT),
 ACCOUNT_WELCOME(NotificationCategory.ACCOUNT), SYSTEM(NotificationCategory.SYSTEM);
 private final NotificationCategory category;
 NotificationType(NotificationCategory category) { this.category=category; }
 public NotificationCategory getCategory() { return category; }
}
