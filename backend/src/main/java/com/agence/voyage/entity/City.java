package com.agence.voyage.entity;

import com.agence.voyage.util.CityNormalizer;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.util.Locale;

@Entity
@Table(name = "cities",
        indexes = {
                @Index(name = "idx_cities_normalized_name", columnList = "normalized_name"),
                @Index(name = "idx_cities_name", columnList = "name")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_cities_normalized_name", columnNames = {"normalized_name"})
        })
public class City {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 120)
    private String name;

    @Column(name = "normalized_name", nullable = false, length = 120)
    private String normalizedName;

    private Double latitude;

    private Double longitude;

    @Column(name = "country", nullable = false, length = 100)
    private String country = "Maroc";

    @Column(name = "country_code", nullable = false, length = 2)
    private String countryCode = "MA";

    @Column(name = "has_airport", nullable = false)
    private Boolean hasAirport = false;

    public City() {
    }

    public City(String name, Double latitude, Double longitude) {
        this.name = name;
        this.latitude = CityNormalizer.roundCoordinate(latitude);
        this.longitude = CityNormalizer.roundCoordinate(longitude);
        this.normalizedName = CityNormalizer.normalizeForComparison(name);
        this.country = "Maroc";
        this.countryCode = "MA";
        this.hasAirport = false;
    }

    public City(String name, Double latitude, Double longitude, String country, String countryCode, Boolean hasAirport) {
        this.name = name;
        this.latitude = CityNormalizer.roundCoordinate(latitude);
        this.longitude = CityNormalizer.roundCoordinate(longitude);
        this.normalizedName = CityNormalizer.normalizeForComparison(name);
        this.country = (country != null && !country.isBlank()) ? country.trim() : "Maroc";
        this.countryCode = (countryCode != null && !countryCode.isBlank()) ? countryCode.trim().toUpperCase(Locale.ROOT) : "MA";
        this.hasAirport = hasAirport != null ? hasAirport : false;
    }

    @PrePersist
    @PreUpdate
    public void preparePersistentState() {
        if (this.name != null) {
            this.normalizedName = CityNormalizer.normalizeForComparison(this.name);
        }
        if (this.latitude != null) {
            this.latitude = CityNormalizer.roundCoordinate(this.latitude);
        }
        if (this.longitude != null) {
            this.longitude = CityNormalizer.roundCoordinate(this.longitude);
        }
        if (this.country == null || this.country.isBlank()) {
            this.country = "Maroc";
        } else {
            this.country = this.country.trim();
        }
        if (this.countryCode == null || this.countryCode.isBlank()) {
            this.countryCode = "MA";
        } else {
            this.countryCode = this.countryCode.trim().toUpperCase(Locale.ROOT);
        }
        if (this.hasAirport == null) {
            this.hasAirport = false;
        }
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
        this.normalizedName = CityNormalizer.normalizeForComparison(name);
    }

    public String getNormalizedName() {
        return normalizedName;
    }

    public void setNormalizedName(String normalizedName) {
        this.normalizedName = normalizedName;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = CityNormalizer.roundCoordinate(latitude);
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = CityNormalizer.roundCoordinate(longitude);
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
