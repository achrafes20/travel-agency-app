package com.agence.voyage.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@org.hibernate.annotations.Check(constraints="capacity >= 0 and available_until > available_from")
@Table(name="offer_availabilities",indexes=@Index(name="idx_availability_offer_end",columnList="offer_id,available_until"))
public class OfferAvailability {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    @OneToMany(mappedBy="availability")
    private java.util.List<BookingItemAllocation> allocations = new java.util.ArrayList<>();
    public Long getId() { return id; }
    public boolean hasAllocations() { return !allocations.isEmpty(); }
    @Column(name = "available_from", nullable = false)
    private LocalDateTime startAt;
    @Column(name = "available_until", nullable = false)
    private LocalDateTime endAt;
    @Column(name = "capacity", nullable = false)
    private Integer capacity = 1;

    public OfferAvailability() {}
    public OfferAvailability(LocalDateTime startAt, LocalDateTime endAt, Integer capacity) {
        this.startAt = startAt; this.endAt = endAt; this.capacity = capacity;
    }
    public LocalDateTime getStartAt() { return startAt; }
    public void setStartAt(LocalDateTime startAt) { this.startAt = startAt; }
    public LocalDateTime getEndAt() { return endAt; }
    public void setEndAt(LocalDateTime endAt) { this.endAt = endAt; }
    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
}
