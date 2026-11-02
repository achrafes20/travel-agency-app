package com.agence.voyage.dto;

import com.agence.voyage.entity.ReviewStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ReviewModerateRequest {

    @NotNull(message = "Le statut est obligatoire")
    private ReviewStatus status;

    @Size(max = 1000, message = "Le motif ne doit pas dépasser 1000 caractères")
    private String reason;

    public ReviewStatus getStatus() {
        return status;
    }

    public void setStatus(ReviewStatus status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}

