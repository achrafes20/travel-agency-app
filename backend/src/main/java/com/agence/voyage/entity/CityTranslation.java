package com.agence.voyage.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "city_translations",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_city_translations_city_locale", columnNames = {"city_id", "locale"})
        })
public class CityTranslation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "city_id", nullable = false)
    private City city;

    @Column(nullable = false, length = 5)
    private String locale;

    @Column(nullable = false, length = 120)
    private String name;

    public CityTranslation() {}

    public CityTranslation(City city, String locale, String name) {
        this.city = city;
        this.locale = locale;
        this.name = name;
    }

    public Long getId() { return id; }
    public City getCity() { return city; }
    public void setCity(City city) { this.city = city; }
    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}

