package com.agence.voyage.dto;

import com.agence.voyage.entity.Car;
import com.agence.voyage.entity.Excursion;
import com.agence.voyage.entity.Flight;
import com.agence.voyage.entity.Hotel;
import com.agence.voyage.entity.Offer;
import com.agence.voyage.entity.OfferType;
import com.agence.voyage.entity.TaxiTransfer;
import com.agence.voyage.entity.OfferAvailability;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class OfferResponse {

    private Long id;

    private OfferType type;

    private String title;

    private String description;

    private Double basePrice;

    private Integer stock;
    private List<AvailabilityView> availabilities;
    private Boolean availableNow;
    private LocalDateTime nextAvailabilityStart;
    private LocalDateTime nextAvailabilityEnd;
    private Integer availableCapacity;

    public static class AvailabilityView {
        private LocalDateTime startAt; private LocalDateTime endAt; private Integer capacity;
        public static AvailabilityView from(OfferAvailability a) { AvailabilityView v = new AvailabilityView(); v.startAt=a.getStartAt(); v.endAt=a.getEndAt(); v.capacity=a.getCapacity(); return v; }
        public LocalDateTime getStartAt() { return startAt; }
        public LocalDateTime getEndAt() { return endAt; }
        public Integer getCapacity() { return capacity; }
    }

    private Boolean allowsPayOnArrival;

    private Boolean active;

    private Double averageRating;

    private Integer reviewCount;

    private String moderationReason;
    private LocalDateTime moderatedAt;
    private Long moderatedById;
    private String moderatedByName;

    private List<String> images;

    private Long cityId;

    private String cityName;
    private String cityCountry;
    private String cityCountryCode;
    private Boolean cityHasAirport;

    private List<String> availableLanguages;
    public List<String> getAvailableLanguages() { return availableLanguages; }
    public void setAvailableLanguages(List<String> availableLanguages) { this.availableLanguages = availableLanguages; }

    public void applyTranslation(com.agence.voyage.entity.OfferTranslation t) {
        if (t != null) {
            if (t.getTitle() != null && !t.getTitle().isBlank()) {
                this.title = t.getTitle();
            }
            if (t.getDescription() != null && !t.getDescription().isBlank()) {
                this.description = t.getDescription();
            }
        }
    }

    private Long supplierId;

    private String supplierName;

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

    public static OfferResponse from(Offer offer) {
        OfferResponse r = new OfferResponse();
        r.id = offer.getId();
        r.title = offer.getTitle();
        r.description = offer.getDescription();
        r.basePrice = offer.getBasePrice();
        r.stock = offer.getStock();
        r.availabilities = offer.getAvailabilities().stream().map(AvailabilityView::from).toList();
        LocalDateTime now = LocalDateTime.now();
        OfferAvailability current = offer.getAvailabilities().stream().filter(a -> !now.isBefore(a.getStartAt()) && now.isBefore(a.getEndAt()) && a.getCapacity() > 0).findFirst().orElse(null);
        OfferAvailability next = offer.getAvailabilities().stream().filter(a -> a.getEndAt().isAfter(now) && a.getCapacity() > 0).min(java.util.Comparator.comparing(OfferAvailability::getStartAt)).orElse(null);
        r.availableNow = Boolean.TRUE.equals(offer.getActive()) && current != null;
        if (next != null) { r.nextAvailabilityStart=next.getStartAt(); r.nextAvailabilityEnd=next.getEndAt(); r.availableCapacity=next.getCapacity(); }
        r.allowsPayOnArrival = offer.getAllowsPayOnArrival();
        r.active = offer.getActive();
        r.averageRating = offer.getAverageRating() != null ? offer.getAverageRating() : 0.0;
        r.reviewCount = offer.getReviewCount() != null ? offer.getReviewCount() : 0;
        r.moderationReason = offer.getModerationReason();
        r.moderatedAt = offer.getModeratedAt();
        if (offer.getModeratedBy() != null) {
            r.moderatedById = offer.getModeratedBy().getId();
            r.moderatedByName = offer.getModeratedBy().getFullName();
        }
        r.images = new ArrayList<>(offer.getImages());
        if (offer.getCity() != null) {
            r.cityId = offer.getCity().getId();
            r.cityName = offer.getCity().getName();
            r.cityCountry = offer.getCity().getCountry();
            r.cityCountryCode = offer.getCity().getCountryCode();
            r.cityHasAirport = offer.getCity().getHasAirport();
        }
        if (offer.getSupplier() != null) {
            r.supplierId = offer.getSupplier().getId();
            r.supplierName = offer.getSupplier().getFullName();
        }
        if (offer instanceof Flight f) {
            r.type = OfferType.FLIGHT;
            r.airline = f.getAirline();
            r.flightNumber = f.getFlightNumber();
            r.departureAirport = f.getDepartureAirport();
            r.arrivalAirport = f.getArrivalAirport();
            r.departureDateTime = f.getDepartureDateTime();
            r.arrivalDateTime = f.getArrivalDateTime();
            r.roundTrip = f.getRoundTrip();
            r.returnDepartureDateTime = f.getReturnDepartureDateTime();
            r.returnArrivalDateTime = f.getReturnArrivalDateTime();
            r.cabinClass = f.getCabinClass();
        } else if (offer instanceof Hotel h) {
            r.type = OfferType.HOTEL;
            r.stars = h.getStars();
            r.roomType = h.getRoomType();
            r.address = h.getAddress();
        } else if (offer instanceof Car c) {
            r.type = OfferType.CAR;
            r.brand = c.getBrand();
            r.model = c.getModel();
            r.transmission = c.getTransmission();
            r.seats = c.getSeats();
            r.pickupLocation = c.getPickupLocation();
            r.dropoffLocations = c.getDropoffLocations();
            r.dropoffLocation = c.getDropoffLocations().stream().findFirst().orElse(c.getPickupLocation());
            r.allowsDifferentDropoff = c.getAllowsDifferentDropoff();
            r.minimumDriverAge = c.getMinimumDriverAge();
            r.maximumDriverAge = c.getMaximumDriverAge();
        } else if (offer instanceof TaxiTransfer t) {
            r.type = OfferType.TAXI_TRANSFER;
            r.pickupLocation = t.getPickupLocation();
            r.dropoffLocation = t.getDropoffLocation();
            r.vehicleType = t.getVehicleType();
        } else if (offer instanceof Excursion e) {
            r.type = OfferType.EXCURSION;
            r.durationHours = e.getDurationHours();
            r.includesGuide = e.getIncludesGuide();
            r.includesTransport = e.getIncludesTransport();
            r.itinerary = e.getItinerary();
        }
        return r;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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
    public List<AvailabilityView> getAvailabilities() { return availabilities; }
    public Boolean getAvailableNow() { return availableNow; }
    public LocalDateTime getNextAvailabilityStart() { return nextAvailabilityStart; }
    public LocalDateTime getNextAvailabilityEnd() { return nextAvailabilityEnd; }
    public Integer getAvailableCapacity() { return availableCapacity; }

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

    public String getModerationReason() { return moderationReason; }
    public void setModerationReason(String moderationReason) { this.moderationReason = moderationReason; }
    public LocalDateTime getModeratedAt() { return moderatedAt; }
    public void setModeratedAt(LocalDateTime moderatedAt) { this.moderatedAt = moderatedAt; }
    public Long getModeratedById() { return moderatedById; }
    public void setModeratedById(Long moderatedById) { this.moderatedById = moderatedById; }
    public String getModeratedByName() { return moderatedByName; }
    public void setModeratedByName(String moderatedByName) { this.moderatedByName = moderatedByName; }

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

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
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
    public LocalDateTime getReturnDepartureDateTime() { return returnDepartureDateTime; }
    public LocalDateTime getReturnArrivalDateTime() { return returnArrivalDateTime; }
    public String getCabinClass() { return cabinClass; }

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
