package com.agence.voyage.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.JoinColumn;
import java.util.ArrayList;
import java.util.List;

@Entity
@DiscriminatorValue("CAR")
public class Car extends Offer {

    private String brand;

    private String model;

    private String transmission;

    private Integer seats;

    @Column(name = "car_pickup_location")
    private String pickupLocation;

    @ElementCollection
    @CollectionTable(name = "car_dropoff_locations", joinColumns = @JoinColumn(name = "offer_id"))
    @Column(name = "location", nullable = false)
    private List<String> dropoffLocations = new ArrayList<>();

    private Boolean allowsDifferentDropoff = false;

    private Integer minimumDriverAge = 21;

    private Integer maximumDriverAge = 75;

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getTransmission() {
        return transmission;
    }

    public void setTransmission(String transmission) {
        this.transmission = transmission;
    }

    public Integer getSeats() {
        return seats;
    }

    public void setSeats(Integer seats) {
        this.seats = seats;
    }

    public String getPickupLocation() { return pickupLocation; }
    public void setPickupLocation(String pickupLocation) { this.pickupLocation = pickupLocation; }
    public List<String> getDropoffLocations() { return dropoffLocations; }
    public void setDropoffLocations(List<String> dropoffLocations) { this.dropoffLocations = dropoffLocations == null ? new ArrayList<>() : new ArrayList<>(dropoffLocations); }
    public Boolean getAllowsDifferentDropoff() { return allowsDifferentDropoff; }
    public void setAllowsDifferentDropoff(Boolean allowsDifferentDropoff) { this.allowsDifferentDropoff = allowsDifferentDropoff; }
    public Integer getMinimumDriverAge() { return minimumDriverAge; }
    public void setMinimumDriverAge(Integer minimumDriverAge) { this.minimumDriverAge = minimumDriverAge; }
    public Integer getMaximumDriverAge() { return maximumDriverAge; }
    public void setMaximumDriverAge(Integer maximumDriverAge) { this.maximumDriverAge = maximumDriverAge; }
}
