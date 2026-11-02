package com.agence.voyage.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "offer_translations",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_offer_translations_offer_locale", columnNames = {"offer_id", "locale"})
        })
public class OfferTranslation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "offer_id", nullable = false)
    private Offer offer;

    @Column(nullable = false, length = 5)
    private String locale;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 4000)
    private String description;

    @Column(length = 4000)
    private String itinerary;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public OfferTranslation() {}

    public OfferTranslation(Offer offer, String locale, String title, String description) {
        this.offer = offer;
        this.locale = locale;
        this.title = title;
        this.description = description;
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Offer getOffer() { return offer; }
    public void setOffer(Offer offer) { this.offer = offer; }
    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getItinerary() { return itinerary; }
    public void setItinerary(String itinerary) { this.itinerary = itinerary; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

