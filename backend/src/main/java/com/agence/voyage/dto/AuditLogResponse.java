package com.agence.voyage.dto;

import com.agence.voyage.entity.AuditLog;

import java.time.LocalDateTime;

public record AuditLogResponse(
        Long id,
        Long actorId,
        String actorEmail,
        String actorRole,
        String action,
        String resourceType,
        Long resourceId,
        String description,
        String beforeJson,
        String afterJson,
        String ipAddress,
        String userAgent,
        LocalDateTime createdAt
) {
    public static AuditLogResponse from(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getActorId(),
                log.getActorEmail(),
                log.getActorRole(),
                log.getAction(),
                log.getResourceType(),
                log.getResourceId(),
                log.getDescription(),
                log.getBeforeJson(),
                log.getAfterJson(),
                log.getIpAddress(),
                log.getUserAgent(),
                log.getCreatedAt()
        );
    }
}

