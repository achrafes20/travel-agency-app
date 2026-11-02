package com.agence.voyage.dto;

import com.agence.voyage.entity.OfferType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;
import java.util.List;

@com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
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

    @PositiveOrZero(message = "Le stock doit être positif")
    private Integer stock;

    @Valid
    private List<AvailabilityInput> availabilities;

    public static class AvailabilityInput {
        @NotNull private LocalDateTime startAt;
        @NotNull private LocalDateTime endAt;
        @NotNull @jakarta.validation.constraints.PositiveOrZero private Integer capacity;
        public LocalDateTime getStartAt() { return startAt; }
        public void setStartAt(LocalDateTime startAt) { this.startAt = startAt; }
        public LocalDateTime getEndAt() { return endAt; }
        public void setEndAt(LocalDateTime endAt) { this.endAt = endAt; }
        public Integer getCapacity() { return capacity; }
        public void setCapacity(Integer capacity) { this.capacity = capacity; }
    }

    private Boolean allowsPayOnArrival;

    private Boolean active;

    private List<String> images;

    private Long cityId;

    @Size(max = 120, message = "Le nom de la ville ne doit pas dépasser 120 caractères")
    private String cityName;

    private Double cityLatitude;

    private Double cityLongitude;

    @Size(max = 100, message = "Le nom du pays ne doit pas dépasser 100 caractères")
    private String cityCountry;

    private String cityCountryCode;

    private Boolean cityHasAirport;

    // Ignoré par l'API : le fournisseur est l'utilisateur authentifié (renseigné par OfferController).
    private Long supplierId;

    private String airline;

    private String flightNumber;

    private String departureAirport;

    private String arrivalAirport;

    private LocalDateTime departureDateTime;

    private LocalDateTime arrivalDateTime;
    private Boolean roundTrip;
    private LocalDateTime returnDepartureDateTime;
    private LocalDateTime returnArrivalDateTime;
    private String cabinClass;

    private Integer stars;

    private String roomType;

    private String address;

    private String brand;

    private String model;

    private String transmission;

    private Integer seats;

    private Boolean allowsDifferentDropoff;

    private Integer minimumDriverAge;

    private Integer maximumDriverAge;

    private String pickupLocation;

    private String dropoffLocation;

    private List<String> dropoffLocations;

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

    public List<AvailabilityInput> getAvailabilities() { return availabilities; }
    public void setAvailabilities(List<AvailabilityInput> availabilities) { this.availabilities = availabilities; }

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

    public String getCityName() {
        return cityName;
    }

    public void setCityName(String cityName) {
        this.cityName = cityName;
    }

    public Double getCityLatitude() {
        return cityLatitude;
    }

    public void setCityLatitude(Double cityLatitude) {
        this.cityLatitude = cityLatitude;
    }

    public Double getCityLongitude() {
        return cityLongitude;
    }

    public void setCityLongitude(Double cityLongitude) {
        this.cityLongitude = cityLongitude;
    }

    public String getCityCountry() {
        return cityCountry;
    }

    public void setCityCountry(String cityCountry) {
        this.cityCountry = cityCountry;
    }

    public String getCityCountryCode() {
        return cityCountryCode;
    }

    public void setCityCountryCode(String cityCountryCode) {
        this.cityCountryCode = cityCountryCode;
    }

    public Boolean getCityHasAirport() {
        return cityHasAirport;
    }

    public void setCityHasAirport(Boolean cityHasAirport) {
        this.cityHasAirport = cityHasAirport;
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
    public Boolean getRoundTrip() { return roundTrip; }
    public void setRoundTrip(Boolean roundTrip) { this.roundTrip = roundTrip; }
    public LocalDateTime getReturnDepartureDateTime() { return returnDepartureDateTime; }
    public void setReturnDepartureDateTime(LocalDateTime value) { this.returnDepartureDateTime = value; }
    public LocalDateTime getReturnArrivalDateTime() { return returnArrivalDateTime; }
    public void setReturnArrivalDateTime(LocalDateTime value) { this.returnArrivalDateTime = value; }
    public String getCabinClass() { return cabinClass; }
    public void setCabinClass(String cabinClass) { this.cabinClass = cabinClass; }

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

    public Boolean getAllowsDifferentDropoff() { return allowsDifferentDropoff; }
    public void setAllowsDifferentDropoff(Boolean allowsDifferentDropoff) { this.allowsDifferentDropoff = allowsDifferentDropoff; }
    public Integer getMinimumDriverAge() { return minimumDriverAge; }
    public void setMinimumDriverAge(Integer minimumDriverAge) { this.minimumDriverAge = minimumDriverAge; }
    public Integer getMaximumDriverAge() { return maximumDriverAge; }
    public void setMaximumDriverAge(Integer maximumDriverAge) { this.maximumDriverAge = maximumDriverAge; }

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

    public List<String> getDropoffLocations() { return dropoffLocations; }
    public void setDropoffLocations(List<String> dropoffLocations) { this.dropoffLocations = dropoffLocations; }

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
