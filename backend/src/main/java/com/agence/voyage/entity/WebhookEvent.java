package com.agence.voyage.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name="webhook_events",uniqueConstraints=@UniqueConstraint(name="uk_webhook_provider_event",columnNames={"provider","event_id"}))
public class WebhookEvent {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @Column(length=32)
    private String provider;

    @Column(length=100)
    private String eventId;

    @Column(length=64)
    private String type;

    @Column(length=64)
    private String payloadHash;

    @Column(nullable=false)
    private LocalDateTime receivedAt;

    
    private LocalDateTime processedAt;

    @Column(length=20)
    private String status;

    public Long getId() { return id; }
    public void setId(Long value) { this.id = value; }
    public String getProvider() { return provider; }
    public void setProvider(String value) { this.provider = value; }
    public String getEventId() { return eventId; }
    public void setEventId(String value) { this.eventId = value; }
    public String getType() { return type; }
    public void setType(String value) { this.type = value; }
    public String getPayloadHash() { return payloadHash; }
    public void setPayloadHash(String value) { this.payloadHash = value; }
    public LocalDateTime getReceivedAt() { return receivedAt; }
    public void setReceivedAt(LocalDateTime value) { this.receivedAt = value; }
    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime value) { this.processedAt = value; }
    public String getStatus() { return status; }
    public void setStatus(String value) { this.status = value; }

}

