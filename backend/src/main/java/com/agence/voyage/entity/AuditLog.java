package com.agence.voyage.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreRemove;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.Immutable;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "audit_logs",
    indexes = {
        @Index(name = "idx_audit_created", columnList = "created_at"),
        @Index(name = "idx_audit_actor", columnList = "actor_id"),
        @Index(name = "idx_audit_action", columnList = "action"),
        @Index(name = "idx_audit_resource", columnList = "resource_type, resource_id, created_at")
    }
)
@Immutable
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(updatable = false)
    private Long id;

    @Column(name = "actor_id", updatable = false)
    private Long actorId;

    @Column(name = "actor_email", length = 255, updatable = false)
    private String actorEmail;

    @Column(name = "actor_role", length = 50, updatable = false)
    private String actorRole;

    @Column(length = 64, nullable = false, updatable = false)
    private String action;

    @Column(name = "resource_type", length = 40, updatable = false)
    private String resourceType;

    @Column(name = "resource_id", updatable = false)
    private Long resourceId;

    @Column(length = 500, updatable = false)
    private String description;

    @Column(name = "before_json", columnDefinition = "TEXT", updatable = false)
    private String beforeJson;

    @Column(name = "after_json", columnDefinition = "TEXT", updatable = false)
    private String afterJson;

    @Column(name = "ip_address", length = 64, updatable = false)
    private String ipAddress;

    @Column(name = "user_agent", length = 255, updatable = false)
    private String userAgent;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public AuditLog() {
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    public void onUpdate() {
        throw new UnsupportedOperationException("Les logs d'audit sont immuables (append-only)");
    }

    @PreRemove
    public void onRemove() {
        throw new UnsupportedOperationException("Les logs d'audit sont immuables (append-only)");
    }

    // Convenience setter for backward compatibility with existing code
    public void setActor(User user) {
        if (user != null) {
            this.actorId = user.getId();
            this.actorEmail = user.getEmail();
            this.actorRole = user.getRole() != null ? user.getRole().name() : null;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getActorId() {
        return actorId;
    }

    public void setActorId(Long actorId) {
        this.actorId = actorId;
    }

    public String getActorEmail() {
        return actorEmail;
    }

    public void setActorEmail(String actorEmail) {
        this.actorEmail = actorEmail;
    }

    public String getActorRole() {
        return actorRole;
    }

    public void setActorRole(String actorRole) {
        this.actorRole = actorRole;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public Long getResourceId() {
        return resourceId;
    }

    public void setResourceId(Long resourceId) {
        this.resourceId = resourceId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getBeforeJson() {
        return beforeJson;
    }

    public void setBeforeJson(String beforeJson) {
        this.beforeJson = beforeJson;
    }

    public String getAfterJson() {
        return afterJson;
    }

    public void setAfterJson(String afterJson) {
        this.afterJson = afterJson;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getIp() {
        return ipAddress;
    }

    public void setIp(String ip) {
        this.ipAddress = ip;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
