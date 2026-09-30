package com.agence.voyage.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("EXCURSION")
public class Excursion extends Offer {

    private Integer durationHours;

    private Boolean includesGuide = false;

    private Boolean includesTransport = false;

    private String itinerary;

    public Integer getDurationHours() {
        return durationHours;
    }

    public void setDurationHours(Integer durationHours) {
        this.durationHours = durationHours;
    }

    public Boolean getIncludesGuide() {
        return includesGuide;
    }

    public void setIncludesGuide(Boolean includesGuide) {
        this.includesGuide = includesGuide;
    }

    public Boolean getIncludesTransport() {
        return includesTransport;
    }

    public void setIncludesTransport(Boolean includesTransport) {
        this.includesTransport = includesTransport;
    }

    public String getItinerary() {
        return itinerary;
    }

    public void setItinerary(String itinerary) {
        this.itinerary = itinerary;
    }
}
