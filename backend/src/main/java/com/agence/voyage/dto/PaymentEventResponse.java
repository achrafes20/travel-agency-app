package com.agence.voyage.dto;
import com.agence.voyage.entity.*;
import java.time.LocalDateTime;
public record PaymentEventResponse(Long id,PaymentStatus fromStatus,PaymentStatus toStatus,String eventType,
 String actorRole,String actorName,String details,LocalDateTime createdAt){
 public static PaymentEventResponse from(PaymentEvent e){return new PaymentEventResponse(e.getId(),e.getFromStatus(),e.getToStatus(),e.getEventType(),e.getActorRole(),e.getActor()==null?null:e.getActor().getFullName(),e.getDetails(),e.getCreatedAt());}
}

