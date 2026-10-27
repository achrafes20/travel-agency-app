package com.agence.voyage.dto;

import jakarta.validation.constraints.NotBlank;

public class ApplyPromoRequest {

    @NotBlank(message = "Saisissez un code promo")
    private String code;

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
