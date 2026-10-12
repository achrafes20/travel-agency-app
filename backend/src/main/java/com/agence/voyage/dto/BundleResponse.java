package com.agence.voyage.dto;

import com.agence.voyage.entity.Bundle;
import com.agence.voyage.entity.Offer;
import com.agence.voyage.entity.OfferType;
import com.agence.voyage.service.OfferService;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;

public class BundleResponse {

    private Long id;
    private String title;
    private String description;
    private Double discountPercentage;
    private Long createdById;
    private String createdByName;
    private List<OfferSummary> offers;
    private List<String> cities;
    private Double sumPrice;
    private Double finalPrice;
    private Integer stock;
    private String limitingOfferTitle;

    public static class OfferSummary {
        private Long id;
        private OfferType type;
        private String title;
        private String cityName;
        private Double basePrice;
        private Integer stock;
        private Boolean active;
        private String image;

        static OfferSummary from(Offer offer) {
            OfferSummary s = new OfferSummary();
            s.id = offer.getId();
            s.type = OfferService.typeOf(offer);
            s.title = offer.getTitle();
            s.cityName = offer.getCity() != null ? offer.getCity().getName() : null;
            s.basePrice = offer.getBasePrice();
            s.stock = offer.getStock();
            s.active = offer.getActive();
            s.image = offer.getImages().isEmpty() ? null : offer.getImages().get(0);
            return s;
        }

        public Long getId() {
            return id;
        }

        public OfferType getType() {
            return type;
        }

        public String getTitle() {
            return title;
        }

        public String getCityName() {
            return cityName;
        }

        public Double getBasePrice() {
            return basePrice;
        }

        public Integer getStock() {
            return stock;
        }

        public Boolean getActive() {
            return active;
        }

        public String getImage() {
            return image;
        }
    }

    public static BundleResponse from(Bundle bundle) {
        BundleResponse r = new BundleResponse();
        r.id = bundle.getId();
        r.title = bundle.getTitle();
        r.description = bundle.getDescription();
        r.discountPercentage = bundle.getDiscountPercentage();
        if (bundle.getCreatedBy() != null) {
            r.createdById = bundle.getCreatedBy().getId();
            r.createdByName = bundle.getCreatedBy().getFullName();
        }
        r.offers = bundle.getOffers().stream().map(OfferSummary::from).toList();
        r.cities = bundle.getOffers().stream()
                .map(o -> o.getCity() != null ? o.getCity().getName() : null)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        r.sumPrice = round(bundle.getOffers().stream()
                .mapToDouble(o -> o.getBasePrice() == null ? 0 : o.getBasePrice()).sum());
        double discount = bundle.getDiscountPercentage() == null ? 0 : bundle.getDiscountPercentage();
        r.finalPrice = round(r.sumPrice * (1 - discount / 100));
        // Dynamic stock (spec 5.3): the lowest stock among the linked offers.
        Offer limiting = bundle.getOffers().stream()
                .min(Comparator.comparingInt(o -> o.getStock() == null ? 0 : o.getStock()))
                .orElse(null);
        r.stock = limiting == null || limiting.getStock() == null ? 0 : limiting.getStock();
        r.limitingOfferTitle = limiting == null ? null : limiting.getTitle();
        return r;
    }

    private static double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public Double getDiscountPercentage() {
        return discountPercentage;
    }

    public Long getCreatedById() {
        return createdById;
    }

    public String getCreatedByName() {
        return createdByName;
    }

    public List<OfferSummary> getOffers() {
        return offers;
    }

    public List<String> getCities() {
        return cities;
    }

    public Double getSumPrice() {
        return sumPrice;
    }

    public Double getFinalPrice() {
        return finalPrice;
    }

    public Integer getStock() {
        return stock;
    }

    public String getLimitingOfferTitle() {
        return limitingOfferTitle;
    }
}
