package com.agence.voyage.dto;

import com.agence.voyage.entity.DiscountType;
import com.agence.voyage.entity.PromoCode;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PromoCodeResponse {

    private Long id;
    private String code;
    private DiscountType discountType;
    private BigDecimal value;
    private LocalDate expiryDate;
    private Boolean active;
    private Boolean expired;

    public static PromoCodeResponse from(PromoCode promo) {
        PromoCodeResponse r = new PromoCodeResponse();
        r.id = promo.getId();
        r.code = promo.getCode();
        r.discountType = promo.getDiscountType();
        r.value = promo.getValue();
        r.expiryDate = promo.getExpiryDate();
        r.active = promo.getActive();
        r.expired = promo.getExpiryDate() != null && promo.getExpiryDate().isBefore(LocalDate.now());
        return r;
    }

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public DiscountType getDiscountType() {
        return discountType;
    }

    public BigDecimal getValue() {
        return value;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public Boolean getActive() {
        return active;
    }

    public Boolean getExpired() {
        return expired;
    }
}
