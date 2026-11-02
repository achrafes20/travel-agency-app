package com.agence.voyage.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name="payment_events",indexes=@Index(name="idx_payment_event_payment",columnList="payment_id,created_at"))
@org.hibernate.annotations.Immutable
public class PaymentEvent {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="payment_id",nullable=false)
    private Payment payment;

    @Enumerated(EnumType.STRING)
    private PaymentStatus fromStatus;

    @Enumerated(EnumType.STRING) @Column(nullable=false)
    private PaymentStatus toStatus;

    @Column(length=40)
    private String eventType;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="actor_id")
    private User actor;

    @Column(length=20)
    private String actorRole;

    @Column(columnDefinition="TEXT")
    private String details;

    @Column(nullable=false)
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long value) { this.id = value; }
    public Payment getPayment() { return payment; }
    public void setPayment(Payment value) { this.payment = value; }
    public PaymentStatus getFromStatus() { return fromStatus; }
    public void setFromStatus(PaymentStatus value) { this.fromStatus = value; }
    public PaymentStatus getToStatus() { return toStatus; }
    public void setToStatus(PaymentStatus value) { this.toStatus = value; }
    public String getEventType() { return eventType; }
    public void setEventType(String value) { this.eventType = value; }
    public User getActor() { return actor; }
    public void setActor(User value) { this.actor = value; }
    public String getActorRole() { return actorRole; }
    public void setActorRole(String value) { this.actorRole = value; }
    public String getDetails() { return details; }
    public void setDetails(String value) { this.details = value; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime value) { this.createdAt = value; }

    @PreRemove private void refuseRemoval() { throw new UnsupportedOperationException("Historique en lecture seule"); }

}

