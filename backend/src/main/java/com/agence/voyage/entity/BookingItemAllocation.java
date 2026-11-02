package com.agence.voyage.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name="booking_allocations", indexes=@Index(name="idx_allocation_availability",columnList="availability_id"))
public class BookingItemAllocation {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="booking_item_id",nullable=false)
    private BookingItem bookingItem;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="availability_id",nullable=false)
    private OfferAvailability availability;
    @Column(nullable=false)
    private Integer quantity;
    @Column(nullable=false)
    private boolean restored = false;
    public Long getId() { return id; }
    public void setId(Long value) { this.id = value; }
    public BookingItem getBookingItem() { return bookingItem; }
    public void setBookingItem(BookingItem value) { this.bookingItem = value; }
    public OfferAvailability getAvailability() { return availability; }
    public void setAvailability(OfferAvailability value) { this.availability = value; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer value) { this.quantity = value; }
    public boolean getRestored() { return restored; }
    public void setRestored(boolean value) { this.restored = value; }

}

