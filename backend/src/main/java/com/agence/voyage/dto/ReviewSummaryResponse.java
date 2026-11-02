package com.agence.voyage.dto;

import java.util.Map;

public class ReviewSummaryResponse {

    private Long offerId;
    private Double averageRating;
    private Long reviewCount;
    private Map<Integer, Long> distribution;
    private Map<Integer, Double> distributionPercentages;

    public ReviewSummaryResponse() {}

    public ReviewSummaryResponse(Long offerId, Double averageRating, Long reviewCount,
                                 Map<Integer, Long> distribution, Map<Integer, Double> distributionPercentages) {
        this.offerId = offerId;
        this.averageRating = averageRating;
        this.reviewCount = reviewCount;
        this.distribution = distribution;
        this.distributionPercentages = distributionPercentages;
    }

    public Long getOfferId() {
        return offerId;
    }

    public void setOfferId(Long offerId) {
        this.offerId = offerId;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Long getReviewCount() {
        return reviewCount;
    }

    public void setReviewCount(Long reviewCount) {
        this.reviewCount = reviewCount;
    }

    public Map<Integer, Long> getDistribution() {
        return distribution;
    }

    public void setDistribution(Map<Integer, Long> distribution) {
        this.distribution = distribution;
    }

    public Map<Integer, Double> getDistributionPercentages() {
        return distributionPercentages;
    }

    public void setDistributionPercentages(Map<Integer, Double> distributionPercentages) {
        this.distributionPercentages = distributionPercentages;
    }
}

