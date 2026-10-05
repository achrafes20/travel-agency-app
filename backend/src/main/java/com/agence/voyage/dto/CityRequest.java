package com.agence.voyage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CityRequest {

    @NotBlank(message = "Le nom de la ville est obligatoire")
    @Size(max = 120, message = "Le nom de la ville ne doit pas dépasser 120 caractères")
    private String name;

    private Double latitude;

    private Double longitude;

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
