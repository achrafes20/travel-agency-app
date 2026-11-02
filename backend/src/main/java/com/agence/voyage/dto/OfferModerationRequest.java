package com.agence.voyage.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class OfferModerationRequest {
    @NotNull
    private Boolean active;

    @Size(max = 1000)
    private String reason;

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
