package com.agence.voyage.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * Ajout au panier : exactement une des deux références ({@code offerId} ou {@code bundleId}).
 * Pour la modification d'une ligne, seule la quantité est lue.
 */
public class CartItemRequest {

    private Long offerId;

    private Long bundleId;

    @Min(value = 1, message = "La quantité doit être d'au moins 1")
    @Max(value = 99, message = "La quantité ne peut pas dépasser 99")
    private Integer quantity;

    public Long getOfferId() {
        return offerId;
    }

    public void setOfferId(Long offerId) {
        this.offerId = offerId;
    }

    public Long getBundleId() {
        return bundleId;
    }

    public void setBundleId(Long bundleId) {
        this.bundleId = bundleId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
