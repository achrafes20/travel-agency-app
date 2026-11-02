package com.agence.voyage.dto;
import com.agence.voyage.entity.*;
import java.time.LocalDateTime;
public record NotificationResponse(Long id,NotificationType type,NotificationCategory category,String title,
 String message,String link,boolean read,LocalDateTime createdAt,LocalDateTime readAt) {
 public static NotificationResponse from(Notification n){return new NotificationResponse(n.getId(),n.getType(),
 n.getType().getCategory(),n.getTitle(),n.getMessage(),n.getLink(),Boolean.TRUE.equals(n.getIsRead()),n.getCreatedAt(),n.getReadAt());}
}
