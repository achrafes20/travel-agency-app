package com.agence.voyage.dto;

import com.agence.voyage.entity.OfferType;

import java.util.List;
import java.util.Map;

/** Une page de résultats du catalogue public, avec le nombre d'offres par type pour les filtres. */
public class OfferSearchResponse {

    private final List<OfferResponse> content;
    private final long totalElements;
    private final int totalPages;
    private final int page;
    private final int size;
    private final Map<OfferType, Long> typeCounts;
    private final double maxPrice;

    public OfferSearchResponse(List<OfferResponse> content, long totalElements, int totalPages, int page, int size,
                               Map<OfferType, Long> typeCounts, double maxPrice) {
        this.content = content;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.page = page;
        this.size = size;
        this.typeCounts = typeCounts;
        this.maxPrice = maxPrice;
    }

    public List<OfferResponse> getContent() {
        return content;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public int getPage() {
        return page;
    }

    public int getSize() {
        return size;
    }

    /** Offres par type selon les autres filtres (ville, prix, paiement), sans le filtre de type lui-même. */
    public Map<OfferType, Long> getTypeCounts() {
        return typeCounts;
    }

    /** Prix le plus élevé du catalogue disponible : borne du curseur de prix. */
    public double getMaxPrice() {
        return maxPrice;
    }
}
