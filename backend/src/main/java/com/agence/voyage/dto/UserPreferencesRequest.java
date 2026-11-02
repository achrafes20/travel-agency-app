package com.agence.voyage.dto;

import jakarta.validation.constraints.Pattern;

public class UserPreferencesRequest {

    @Pattern(regexp = "^(fr|en|ar)$", message = "La langue doit être fr, en ou ar")
    private String preferredLanguage;

    @Pattern(regexp = "^(MAD|EUR|USD|GBP)$", message = "La devise doit être MAD, EUR, USD ou GBP")
    private String preferredCurrency;

    public UserPreferencesRequest() {}

    public UserPreferencesRequest(String preferredLanguage, String preferredCurrency) {
        this.preferredLanguage = preferredLanguage;
        this.preferredCurrency = preferredCurrency;
    }

    public String getPreferredLanguage() { return preferredLanguage; }
    public void setPreferredLanguage(String preferredLanguage) { this.preferredLanguage = preferredLanguage; }
    public String getPreferredCurrency() { return preferredCurrency; }
    public void setPreferredCurrency(String preferredCurrency) { this.preferredCurrency = preferredCurrency; }
}

