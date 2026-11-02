package com.agence.voyage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class OfferTranslationRequest {

    @NotBlank(message = "Le titre traduit est obligatoire")
    @Size(max = 150, message = "Le titre ne doit pas dépasser 150 caractères")
    private String title;

    @Size(max = 4000, message = "La description ne doit pas dépasser 4000 caractères")
    private String description;

    @Size(max = 4000, message = "L'itinéraire ne doit pas dépasser 4000 caractères")
    private String itinerary;

    public OfferTranslationRequest() {}

    public OfferTranslationRequest(String title, String description) {
        this.title = title;
        this.description = description;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getItinerary() { return itinerary; }
    public void setItinerary(String itinerary) { this.itinerary = itinerary; }
}

