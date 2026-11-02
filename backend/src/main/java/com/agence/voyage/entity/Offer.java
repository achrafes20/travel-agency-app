package com.agence.voyage.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;

@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "offer_type")
@Table(name = "offers",indexes=@jakarta.persistence.Index(name="idx_offer_supplier_active",columnList="supplier_id,active"))
public abstract class Offer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(length = 2000)
    private String description;

    private Double basePrice;

    private Integer stock;

    private Boolean allowsPayOnArrival = false;

    private Boolean active = true;

    @Column(nullable = false)
    private Double averageRating = 0.0;

    @Column(nullable = false)
    private Integer reviewCount = 0;

    @jakarta.persistence.OneToMany(cascade=jakarta.persistence.CascadeType.ALL, orphanRemoval=true)
    @JoinColumn(name="offer_id", nullable=false)
    private List<OfferAvailability> availabilities = new ArrayList<>();

    @Column(length = 1000)
    private String moderationReason;

    private LocalDateTime moderatedAt;

    @ManyToOne
    @JoinColumn(name = "moderated_by_admin_id")
    private User moderatedBy;

    @ElementCollection
    @CollectionTable(name = "offer_images", joinColumns = @JoinColumn(name = "offer_id"))
    @Column(name = "image_path")
    private List<String> images = new ArrayList<>();

    @ManyToOne(optional = false)
    @JoinColumn(name = "city_id", nullable = false)
    private City city;

    @ManyToOne(optional = false)
    @JoinColumn(name = "supplier_id", nullable = false)
    private User supplier;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getBasePrice() {
        return basePrice;
    }

    public void setBasePrice(Double basePrice) {
        this.basePrice = basePrice;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public Boolean getAllowsPayOnArrival() {
        return allowsPayOnArrival;
    }

    public void setAllowsPayOnArrival(Boolean allowsPayOnArrival) {
        this.allowsPayOnArrival = allowsPayOnArrival;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public List<OfferAvailability> getAvailabilities() { return availabilities; }
    public void setAvailabilities(List<OfferAvailability> values) {
        // Les périodes allouées gardent leur identité et leur capacité résiduelle.
        List<OfferAvailability> next = new ArrayList<>();
        for (OfferAvailability value : values) {
            OfferAvailability existing = this.availabilities.stream().filter(a ->
                a.getStartAt().truncatedTo(java.time.temporal.ChronoUnit.MINUTES).equals(value.getStartAt().truncatedTo(java.time.temporal.ChronoUnit.MINUTES))
                && a.getEndAt().truncatedTo(java.time.temporal.ChronoUnit.MINUTES).equals(value.getEndAt().truncatedTo(java.time.temporal.ChronoUnit.MINUTES))).findFirst().orElse(null);
            if (existing != null && existing.hasAllocations()) {
                if (!existing.getCapacity().equals(value.getCapacity())) throw new com.agence.voyage.exception.BusinessException("Une période réservée ne peut pas être remplacée ou redimensionnée");
                next.add(existing);
            } else next.add(value);
        }
        if (this.availabilities.stream().anyMatch(a -> a.hasAllocations() && !next.contains(a)))
            throw new com.agence.voyage.exception.BusinessException("Une période liée à une réservation ne peut pas être supprimée");
        this.availabilities.clear(); this.availabilities.addAll(next);
    }

    public String getModerationReason() { return moderationReason; }
    public void setModerationReason(String moderationReason) { this.moderationReason = moderationReason; }
    public LocalDateTime getModeratedAt() { return moderatedAt; }
    public void setModeratedAt(LocalDateTime moderatedAt) { this.moderatedAt = moderatedAt; }
    public User getModeratedBy() { return moderatedBy; }
    public void setModeratedBy(User moderatedBy) { this.moderatedBy = moderatedBy; }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }

    public City getCity() {
        return city;
    }

    public void setCity(City city) {
        this.city = city;
    }

    public User getSupplier() {
        return supplier;
    }

    public void setSupplier(User supplier) {
        this.supplier = supplier;
    }

    public Double getAverageRating() {
        return averageRating != null ? averageRating : 0.0;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Integer getReviewCount() {
        return reviewCount != null ? reviewCount : 0;
    }

    public void setReviewCount(Integer reviewCount) {
        this.reviewCount = reviewCount;
    }
}
