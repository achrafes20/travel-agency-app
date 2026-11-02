package com.agence.voyage.dto;

import com.agence.voyage.entity.OfferTranslation;
import java.time.LocalDateTime;

public class OfferTranslationResponse {

    private Long id;
    private Long offerId;
    private String locale;
    private String title;
    private String description;
    private String itinerary;
    private String status;
    private LocalDateTime updatedAt;

    public OfferTranslationResponse() {}

    public static OfferTranslationResponse from(OfferTranslation t) {
        OfferTranslationResponse resp = new OfferTranslationResponse();
        resp.id = t.getId();
        resp.offerId = t.getOffer().getId();
        resp.locale = t.getLocale();
        resp.title = t.getTitle();
        resp.description = t.getDescription();
        resp.itinerary = t.getItinerary();
        resp.status = t.getStatus();
        resp.updatedAt = t.getUpdatedAt();
        return resp;
    }

    public Long getId() { return id; }
    public Long getOfferId() { return offerId; }
    public String getLocale() { return locale; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getItinerary() { return itinerary; }
    public String getStatus() { return status; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}

