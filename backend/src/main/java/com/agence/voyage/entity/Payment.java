package com.agence.voyage.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@org.hibernate.annotations.Check(constraints="(amount > 0 or (amount = 0 and provider = 'COMPLIMENTARY')) and refunded_amount >= 0 and reserved_refund_amount >= 0 and refunded_amount + reserved_refund_amount <= amount")
@org.hibernate.annotations.DynamicUpdate
@Table(name="payments", uniqueConstraints=@UniqueConstraint(name="uk_payment_client_key", columnNames={"client_id","idempotency_key"}), indexes={@Index(name="idx_payment_booking_status",columnList="booking_id,status"),@Index(name="idx_payment_created",columnList="created_at"),@Index(name="idx_payment_status",columnList="status")})
public class Payment {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="booking_id",nullable=false)
    private Booking booking;

    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="client_id", nullable=false)
    private User client;

    @Enumerated(EnumType.STRING) @Column(nullable=false)
    private PaymentMethod method;

    @Enumerated(EnumType.STRING) @Column(nullable=false)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(nullable=false, precision=12, scale=2)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(nullable=false, precision=12, scale=2)
    private BigDecimal refundedAmount = BigDecimal.ZERO;

    @Column(nullable=false, precision=12, scale=2)
    private BigDecimal reservedRefundAmount = BigDecimal.ZERO;

    @Column(nullable=false,length=3)
    private String currency = "MAD";

    @Column(nullable=false,length=32)
    private String provider = "SANDBOX";

    @Column(unique=true,length=100)
    private String providerReference;

    @Column(length=64)
    private String idempotencyKey;

    @Column(unique=true)
    private Long activeBookingId;

    @Column(length=20)
    private String cardBrand;

    @Column(length=4)
    private String cardLast4;

    @Column(length=64)
    private String failureCode;

    @Column(length=255)
    private String failureMessage;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="collected_by_id")
    private User collectedBy;

    @Column(nullable=false)
    private LocalDateTime createdAt;

    @Column(nullable=false)
    private LocalDateTime updatedAt;


    private LocalDateTime paidAt;


    private LocalDateTime refundedAt;

    @Version
    private Long version;

    public Long getId() { return id; }
    public void setId(Long value) { this.id = value; }
    public Booking getBooking() { return booking; }
    public void setBooking(Booking value) { this.booking = value; }
    public User getClient() { return client; }
    public void setClient(User value) { this.client = value; }
    public PaymentMethod getMethod() { return method; }
    public void setMethod(PaymentMethod value) { this.method = value; }
    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus value) { this.status = value; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal value) { this.amount = value; }
    public BigDecimal getRefundedAmount() { return refundedAmount; }
    public void setRefundedAmount(BigDecimal value) { this.refundedAmount = value; }
    public BigDecimal getReservedRefundAmount() { return reservedRefundAmount; }
    public void setReservedRefundAmount(BigDecimal value) { this.reservedRefundAmount = value; }
    public String getCurrency() { return currency; }
    public void setCurrency(String value) { this.currency = value; }
    public String getProvider() { return provider; }
    public void setProvider(String value) { this.provider = value; }
    public String getProviderReference() { return providerReference; }
    public void setProviderReference(String value) { this.providerReference = value; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String value) { this.idempotencyKey = value; }
    public Long getActiveBookingId() { return activeBookingId; }
    public void setActiveBookingId(Long value) { this.activeBookingId = value; }
    public String getCardBrand() { return cardBrand; }
    public void setCardBrand(String value) { this.cardBrand = value; }
    public String getCardLast4() { return cardLast4; }
    public void setCardLast4(String value) { this.cardLast4 = value; }
    public String getFailureCode() { return failureCode; }
    public void setFailureCode(String value) { this.failureCode = value; }
    public String getFailureMessage() { return failureMessage; }
    public void setFailureMessage(String value) { this.failureMessage = value; }
    public User getCollectedBy() { return collectedBy; }
    public void setCollectedBy(User value) { this.collectedBy = value; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime value) { this.createdAt = value; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime value) { this.updatedAt = value; }
    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime value) { this.paidAt = value; }
    public LocalDateTime getRefundedAt() { return refundedAt; }
    public void setRefundedAt(LocalDateTime value) { this.refundedAt = value; }
    public Long getVersion() { return version; }
    public void setVersion(Long value) { this.version = value; }

}
