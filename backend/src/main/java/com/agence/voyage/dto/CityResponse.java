package com.agence.voyage.dto;

import com.agence.voyage.entity.City;

public class CityResponse {

    private Long id;
    private String name;
    private Double latitude;
    private Double longitude;
    private String country;
    private String countryCode;
    private Boolean hasAirport;
    private Long offerCount = 0L;
    private String localizedName;
    public String getLocalizedName() { return localizedName != null ? localizedName : name; }
    public void setLocalizedName(String localizedName) { this.localizedName = localizedName; }

    public CityResponse() {
    }

    public CityResponse(Long id, String name, Double latitude, Double longitude) {
        this.id = id;
        this.name = name;
        this.latitude = latitude;
        this.longitude = longitude;
        this.country = "Maroc";
        this.countryCode = "MA";
        this.hasAirport = false;
        this.offerCount = 0L;
    }

    public CityResponse(Long id, String name, Double latitude, Double longitude, String country, String countryCode, Boolean hasAirport, Long offerCount) {
        this.id = id;
        this.name = name;
        this.latitude = latitude;
        this.longitude = longitude;
        this.country = country != null ? country : "Maroc";
        this.countryCode = countryCode != null ? countryCode : "MA";
        this.hasAirport = hasAirport != null ? hasAirport : false;
        this.offerCount = offerCount != null ? offerCount : 0L;
    }

    public static CityResponse from(City city) {
        if (city == null) return null;
        return new CityResponse(
                city.getId(),
                city.getName(),
                city.getLatitude(),
                city.getLongitude(),
                city.getCountry(),
                city.getCountryCode(),
                city.getHasAirport(),
                0L
        );
    }

    public static CityResponse from(City city, Long offerCount) {
        if (city == null) return null;
        return new CityResponse(
                city.getId(),
                city.getName(),
                city.getLatitude(),
                city.getLongitude(),
                city.getCountry(),
                city.getCountryCode(),
                city.getHasAirport(),
                offerCount
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public Long getOfferCount() {
        return offerCount;
    }

    public void setOfferCount(Long offerCount) {
        this.offerCount = offerCount;
    }
}
