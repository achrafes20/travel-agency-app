package com.agence.voyage.dto;

import com.agence.voyage.entity.Car;
import com.agence.voyage.entity.Excursion;
import com.agence.voyage.entity.Flight;
import com.agence.voyage.entity.Hotel;
import com.agence.voyage.entity.Offer;
import com.agence.voyage.entity.OfferType;
import com.agence.voyage.entity.TaxiTransfer;

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

    private Boolean allowsPayOnArrival;

    private Boolean active;

    private List<String> images;

    private Long cityId;

    private String cityName;

    private Long supplierId;

    private String supplierName;

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

    public static OfferResponse from(Offer offer) {
        OfferResponse r = new OfferResponse();
        r.id = offer.getId();
        r.title = offer.getTitle();
        r.description = offer.getDescription();
        r.basePrice = offer.getBasePrice();
        r.stock = offer.getStock();
        r.allowsPayOnArrival = offer.getAllowsPayOnArrival();
        r.active = offer.getActive();
        r.images = new ArrayList<>(offer.getImages());
        if (offer.getCity() != null) {
            r.cityId = offer.getCity().getId();
            r.cityName = offer.getCity().getName();
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
