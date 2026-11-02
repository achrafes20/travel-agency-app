package com.agence.voyage.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

import java.time.LocalDateTime;

@Entity
@DiscriminatorValue("FLIGHT")
public class Flight extends Offer {

    private String airline;

    private String flightNumber;

    private String departureAirport;

    private String arrivalAirport;

    private LocalDateTime departureDateTime;

    private LocalDateTime arrivalDateTime;
    private Boolean roundTrip = false;
    private LocalDateTime returnDepartureDateTime;
    private LocalDateTime returnArrivalDateTime;
    private String cabinClass;

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
}
