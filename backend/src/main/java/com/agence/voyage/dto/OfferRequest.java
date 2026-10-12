package com.agence.voyage.dto;

import com.agence.voyage.entity.OfferType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public class OfferRequest {

    @NotNull(message = "Le type d'offre est obligatoire")
    private OfferType type;

    @NotBlank(message = "Le titre est obligatoire")
    @Size(max = 200, message = "Le titre ne doit pas dépasser 200 caractères")
    private String title;

    @Size(max = 2000, message = "La description ne doit pas dépasser 2000 caractères")
    private String description;

    @NotNull(message = "Le prix de base est obligatoire")
    @PositiveOrZero(message = "Le prix de base doit être positif")
    private Double basePrice;

    @NotNull(message = "Le stock est obligatoire")
    @PositiveOrZero(message = "Le stock doit être positif")
    private Integer stock;

    private Boolean allowsPayOnArrival;

    private Boolean active;

    private List<String> images;

    @NotNull(message = "La ville est obligatoire")
    private Long cityId;

    @NotNull(message = "Le fournisseur est obligatoire")
    private Long supplierId;

    private String airline;

    private String flightNumber;

    private String departureAirport;

    private String arrivalAirport;

    private LocalDateTime departureDateTime;

    private LocalDateTime arrivalDateTime;

    private Integer stars;

    private String roomType;

    private String address;

    private String brand;

    private String model;

    private String transmission;

    private Integer seats;

    private String pickupLocation;

    private String dropoffLocation;

    private String vehicleType;

    private Integer durationHours;

    private Boolean includesGuide;

    private Boolean includesTransport;

    private String itinerary;


    public OfferType getType() {
        return type;
    }

    public void setType(OfferType type) {
        this.type = type;
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

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }

    public Long getCityId() {
        return cityId;
    }

    public void setCityId(Long cityId) {
        this.cityId = cityId;
    }

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public String getAirline() {
        return airline;
    }

    public void setAirline(String airline) {
        this.airline = airline;
    }

    public String getFlightNumber() {
        return flightNumber;
    }

    public void setFlightNumber(String flightNumber) {
        this.flightNumber = flightNumber;
    }

    public String getDepartureAirport() {
        return departureAirport;
    }

    public void setDepartureAirport(String departureAirport) {
        this.departureAirport = departureAirport;
    }

    public String getArrivalAirport() {
        return arrivalAirport;
    }

    public void setArrivalAirport(String arrivalAirport) {
        this.arrivalAirport = arrivalAirport;
    }

    public LocalDateTime getDepartureDateTime() {
        return departureDateTime;
    }

    public void setDepartureDateTime(LocalDateTime departureDateTime) {
        this.departureDateTime = departureDateTime;
    }

    public LocalDateTime getArrivalDateTime() {
        return arrivalDateTime;
    }

    public void setArrivalDateTime(LocalDateTime arrivalDateTime) {
        this.arrivalDateTime = arrivalDateTime;
    }

    public Integer getStars() {
        return stars;
    }

    public void setStars(Integer stars) {
        this.stars = stars;
    }

    public String getRoomType() {
        return roomType;
    }

    public void setRoomType(String roomType) {
        this.roomType = roomType;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

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

    public String getPickupLocation() {
        return pickupLocation;
    }

    public void setPickupLocation(String pickupLocation) {
        this.pickupLocation = pickupLocation;
    }

    public String getDropoffLocation() {
        return dropoffLocation;
    }

    public void setDropoffLocation(String dropoffLocation) {
        this.dropoffLocation = dropoffLocation;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }

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
