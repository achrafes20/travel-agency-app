package com.agence.voyage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CityRequest {

    @NotBlank(message = "Le nom de la ville est obligatoire")
    @Size(max = 120, message = "Le nom de la ville ne doit pas dépasser 120 caractères")
    private String name;

    private Double latitude;

    private Double longitude;

    @Size(max = 100, message = "Le nom du pays ne doit pas dépasser 100 caractères")
    private String country;

    @Pattern(regexp = "^[A-Z]{2}$", message = "Le code pays doit être composé de 2 lettres majuscules (ex: MA, FR)")
    private String countryCode;

    private Boolean hasAirport;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public Boolean getHasAirport() {
        return hasAirport;
    }

    public void setHasAirport(Boolean hasAirport) {
        this.hasAirport = hasAirport;
    }
}
