package com.agence.voyage.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name="idempotency_records",uniqueConstraints=@UniqueConstraint(name="uk_idempotency_user_key",columnNames={"user_id","request_key"}),indexes=@Index(name="idx_idempotency_expiry",columnList="expires_at"))
public class IdempotencyRecord {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @Column(name="request_key",nullable=false,length=64)
    private String key;

    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="user_id", nullable=false)
    private User user;

    @Column(length=100)
    private String endpoint;

    @Column(length=64)
    private String requestHash;

    
    private Integer responseStatus;

    @Column(columnDefinition="TEXT")
    private String responseBody;

    
    private Long paymentId;

    @Column(precision=12,scale=2)
    private BigDecimal operationAmount;

    @Column(nullable=false)
    private LocalDateTime createdAt;

    @Column(nullable=false)
    private LocalDateTime expiresAt;

    public Long getId() { return id; }
    public void setId(Long value) { this.id = value; }
    public String getKey() { return key; }
    public void setKey(String value) { this.key = value; }
    public User getUser() { return user; }
    public void setUser(User value) { this.user = value; }
    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String value) { this.endpoint = value; }
    public String getRequestHash() { return requestHash; }
    public void setRequestHash(String value) { this.requestHash = value; }
    public Integer getResponseStatus() { return responseStatus; }
    public void setResponseStatus(Integer value) { this.responseStatus = value; }
    public String getResponseBody() { return responseBody; }
    public void setResponseBody(String value) { this.responseBody = value; }
    public Long getPaymentId() { return paymentId; }
    public void setPaymentId(Long value) { this.paymentId = value; }
    public BigDecimal getOperationAmount() { return operationAmount; }
    public void setOperationAmount(BigDecimal value) { this.operationAmount = value; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime value) { this.createdAt = value; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime value) { this.expiresAt = value; }

}

