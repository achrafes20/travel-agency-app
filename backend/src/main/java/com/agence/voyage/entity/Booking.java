package com.agence.voyage.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@org.hibernate.annotations.DynamicUpdate
@Table(name = "bookings", indexes = {@Index(name="idx_booking_expiry", columnList="status,expiresAt"),
 @Index(name="idx_booking_status_created",columnList="status,created_at"),@Index(name="idx_booking_client",columnList="client_id")})
public class Booking {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    @Column(nullable=false, unique=true, length=32)
    private String reference;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="client_id", nullable=false)
    private User client;
    @Enumerated(EnumType.STRING) @Column(nullable=false)
    private BookingStatus status = BookingStatus.PENDING;
    @Enumerated(EnumType.STRING) @Column(nullable=false)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;
    @Enumerated(EnumType.STRING) @Column(nullable=false)
    private PaymentMethod paymentMethod;
    @Column(nullable=false, precision=12, scale=2)
    private BigDecimal subtotal = BigDecimal.ZERO;
    @Column(nullable=false, precision=12, scale=2)
    private BigDecimal discount = BigDecimal.ZERO;
    @Column(nullable=false, precision=12, scale=2)
    private BigDecimal total = BigDecimal.ZERO;
    @Column(nullable=false, length=3)
    private String currency = "MAD";
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="promo_code_id")
    private PromoCode promoCode;
    
    private String promoCodeSnapshot;
    @Enumerated(EnumType.STRING)
    private DiscountType promoTypeSnapshot;
    @Column(precision=12, scale=2)
    private BigDecimal promoValueSnapshot;
    @Column(nullable=false)
    private LocalDateTime createdAt;
    
    private LocalDateTime confirmedAt;
    
    private LocalDateTime cancelledAt;
    
    private LocalDateTime expiresAt;
    
    private LocalDateTime serviceStartAt;
    
    private LocalDateTime serviceEndAt;
    @Column(length=1000)
    private String cancellationReason;
    
    private Long cancelledBy;
    @Column(length=40)
    private String contactPhone;
    @Column(length=2000)
    private String notes;
    @Version
    private Long version;
    @OneToMany(mappedBy="booking", cascade=CascadeType.ALL, orphanRemoval=true) @OrderBy("id")
    private List<BookingItem> items = new ArrayList<>();
    public Long getId() { return id; }
    public void setId(Long value) { this.id = value; }
    public String getReference() { return reference; }
    public void setReference(String value) { this.reference = value; }
    public User getClient() { return client; }
    public void setClient(User value) { this.client = value; }
    public BookingStatus getStatus() { return status; }
    public void setStatus(BookingStatus value) { this.status = value; }
    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus value) { this.paymentStatus = value; }
    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod value) { this.paymentMethod = value; }
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal value) { this.subtotal = value; }
    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal value) { this.discount = value; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal value) { this.total = value; }
    public String getCurrency() { return currency; }
    public void setCurrency(String value) { this.currency = value; }
    public PromoCode getPromoCode() { return promoCode; }
    public void setPromoCode(PromoCode value) { this.promoCode = value; }
    public String getPromoCodeSnapshot() { return promoCodeSnapshot; }
    public void setPromoCodeSnapshot(String value) { this.promoCodeSnapshot = value; }
    public DiscountType getPromoTypeSnapshot() { return promoTypeSnapshot; }
    public void setPromoTypeSnapshot(DiscountType value) { this.promoTypeSnapshot = value; }
    public BigDecimal getPromoValueSnapshot() { return promoValueSnapshot; }
    public void setPromoValueSnapshot(BigDecimal value) { this.promoValueSnapshot = value; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime value) { this.createdAt = value; }
    public LocalDateTime getConfirmedAt() { return confirmedAt; }
    public void setConfirmedAt(LocalDateTime value) { this.confirmedAt = value; }
    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime value) { this.cancelledAt = value; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime value) { this.expiresAt = value; }
    public LocalDateTime getServiceStartAt() { return serviceStartAt; }
    public void setServiceStartAt(LocalDateTime value) { this.serviceStartAt = value; }
    public LocalDateTime getServiceEndAt() { return serviceEndAt; }
    public void setServiceEndAt(LocalDateTime value) { this.serviceEndAt = value; }
    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String value) { this.cancellationReason = value; }
    public Long getCancelledBy() { return cancelledBy; }
    public void setCancelledBy(Long value) { this.cancelledBy = value; }
    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String value) { this.contactPhone = value; }
    public String getNotes() { return notes; }
    public void setNotes(String value) { this.notes = value; }
    public Long getVersion() { return version; }
    public void setVersion(Long value) { this.version = value; }
    public List<BookingItem> getItems() { return items; }
    public void setItems(List<BookingItem> value) { this.items = value; }

}

