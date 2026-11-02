package com.agence.voyage.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@org.hibernate.annotations.Check(constraints="(offer_id is null) <> (bundle_id is null)")
@Table(name="booking_items", indexes={@Index(name="idx_bi_booking", columnList="booking_id"), @Index(name="idx_bi_supplier", columnList="supplier_id"), @Index(name="idx_bi_offer", columnList="offer_id")})
public class BookingItem {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="booking_id",nullable=false)
    private Booking booking;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="offer_id")
    private Offer offer;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="bundle_id")
    private Bundle bundle;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="parent_item_id")
    private BookingItem parentItem;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="supplier_id")
    private User supplier;
    @Column(nullable=false)
    private String titleSnapshot;
    @Column(nullable=false)
    private Integer quantity;
    @Column(nullable=false, precision=12,scale=2)
    private BigDecimal unitPrice;
    @Column(nullable=false, precision=12,scale=2)
    private BigDecimal lineTotal;
    @Column(columnDefinition="TEXT")
    private String travelCriteria;
    @Column(nullable=false)
    private LocalDateTime serviceStartAt;
    @Column(nullable=false)
    private LocalDateTime serviceEndAt;
    @OneToMany(mappedBy="bookingItem",cascade=CascadeType.ALL,orphanRemoval=true)
    private List<BookingItemAllocation> allocations = new ArrayList<>();
    public Long getId() { return id; }
    public void setId(Long value) { this.id = value; }
    public Booking getBooking() { return booking; }
    public void setBooking(Booking value) { this.booking = value; }
    public Offer getOffer() { return offer; }
    public void setOffer(Offer value) { this.offer = value; }
    public Bundle getBundle() { return bundle; }
    public void setBundle(Bundle value) { this.bundle = value; }
    public BookingItem getParentItem() { return parentItem; }
    public void setParentItem(BookingItem value) { this.parentItem = value; }
    public User getSupplier() { return supplier; }
    public void setSupplier(User value) { this.supplier = value; }
    public String getTitleSnapshot() { return titleSnapshot; }
    public void setTitleSnapshot(String value) { this.titleSnapshot = value; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer value) { this.quantity = value; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal value) { this.unitPrice = value; }
    public BigDecimal getLineTotal() { return lineTotal; }
    public void setLineTotal(BigDecimal value) { this.lineTotal = value; }
    public String getTravelCriteria() { return travelCriteria; }
    public void setTravelCriteria(String value) { this.travelCriteria = value; }
    public LocalDateTime getServiceStartAt() { return serviceStartAt; }
    public void setServiceStartAt(LocalDateTime value) { this.serviceStartAt = value; }
    public LocalDateTime getServiceEndAt() { return serviceEndAt; }
    public void setServiceEndAt(LocalDateTime value) { this.serviceEndAt = value; }
    public List<BookingItemAllocation> getAllocations() { return allocations; }
    public void setAllocations(List<BookingItemAllocation> value) { this.allocations = value; }

}

