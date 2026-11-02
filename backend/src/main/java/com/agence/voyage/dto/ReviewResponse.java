package com.agence.voyage.dto;

import com.agence.voyage.entity.Review;
import com.agence.voyage.entity.ReviewStatus;

import java.time.LocalDateTime;

public class ReviewResponse {

    private Long id;
    private Long offerId;
    private String offerTitle;
    private Long clientId;
    private String clientName;
    private Long bookingId;
    private String bookingReference;
    private Integer rating;
    private String title;
    private String comment;
    private ReviewStatus status;
    private String moderationReason;
    private String supplierReply;
    private LocalDateTime supplierRepliedAt;
    private Integer reportCount;
    private Boolean verifiedBooking;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ReviewResponse from(Review review) {
        ReviewResponse res = new ReviewResponse();
        res.setId(review.getId());
        if (review.getOffer() != null) {
            res.setOfferId(review.getOffer().getId());
            res.setOfferTitle(review.getOffer().getTitle());
        }
        if (review.getClient() != null) {
            res.setClientId(review.getClient().getId());
            res.setClientName(review.getClient().getFullName());
        }
        if (review.getBooking() != null) {
            res.setBookingId(review.getBooking().getId());
            res.setBookingReference(review.getBooking().getReference());
            res.setVerifiedBooking(true);
        } else {
            res.setVerifiedBooking(false);
        }
        res.setRating(review.getRating());
        res.setTitle(review.getTitle());
        res.setComment(review.getComment());
        res.setStatus(review.getStatus());
        res.setModerationReason(review.getModerationReason());
        res.setSupplierReply(review.getSupplierReply());
        res.setSupplierRepliedAt(review.getSupplierRepliedAt());
        res.setReportCount(review.getReportCount());
        res.setCreatedAt(review.getCreatedAt());
        res.setUpdatedAt(review.getUpdatedAt());
        return res;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOfferId() {
        return offerId;
    }

    public void setOfferId(Long offerId) {
        this.offerId = offerId;
    }

    public String getOfferTitle() {
        return offerTitle;
    }

    public void setOfferTitle(String offerTitle) {
        this.offerTitle = offerTitle;
    }

    public Long getClientId() {
        return clientId;
    }

    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public String getBookingReference() {
        return bookingReference;
    }

    public void setBookingReference(String bookingReference) {
        this.bookingReference = bookingReference;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public ReviewStatus getStatus() {
        return status;
    }

    public void setStatus(ReviewStatus status) {
        this.status = status;
    }

    public String getModerationReason() {
        return moderationReason;
    }

    public void setModerationReason(String moderationReason) {
        this.moderationReason = moderationReason;
    }

    public String getSupplierReply() {
        return supplierReply;
    }

    public void setSupplierReply(String supplierReply) {
        this.supplierReply = supplierReply;
    }

    public LocalDateTime getSupplierRepliedAt() {
        return supplierRepliedAt;
    }

    public void setSupplierRepliedAt(LocalDateTime supplierRepliedAt) {
        this.supplierRepliedAt = supplierRepliedAt;
    }

    public Integer getReportCount() {
        return reportCount;
    }

    public void setReportCount(Integer reportCount) {
        this.reportCount = reportCount;
    }

    public Boolean getVerifiedBooking() {
        return verifiedBooking;
    }

    public void setVerifiedBooking(Boolean verifiedBooking) {
        this.verifiedBooking = verifiedBooking;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

