package com.agence.voyage.dto;

import com.agence.voyage.entity.City;

public class CityResponse {

    private Long id;
    private String name;
    private Double latitude;
    private Double longitude;

    public CityResponse() {
    }

    public CityResponse(Long id, String name, Double latitude, Double longitude) {
        this.id = id;
        this.name = name;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public static CityResponse from(City city) {
        return new CityResponse(city.getId(), city.getName(), city.getLatitude(), city.getLongitude());
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
}
