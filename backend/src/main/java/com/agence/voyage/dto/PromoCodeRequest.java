package com.agence.voyage.dto;

import com.agence.voyage.entity.DiscountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PromoCodeRequest {

    @NotBlank(message = "Le code est obligatoire")
    @Size(min = 3, max = 30, message = "Le code doit contenir entre 3 et 30 caractères")
    @Pattern(regexp = "^[A-Za-z0-9_-]*$", message = "Le code ne peut contenir que des lettres, chiffres, tirets et underscores")
    private String code;

    @NotNull(message = "Le type de réduction est obligatoire")
    private DiscountType discountType;

    @NotNull(message = "La valeur est obligatoire")
    @DecimalMin(value = "0.01", message = "La valeur doit être supérieure à 0")
    private BigDecimal value;

    private LocalDate expiryDate;

    private Boolean active;

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public DiscountType getDiscountType() {
        return discountType;
    }

    public void setDiscountType(DiscountType discountType) {
        this.discountType = discountType;
    }

    public BigDecimal getValue() {
        return value;
    }

    public void setValue(BigDecimal value) {
        this.value = value;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
