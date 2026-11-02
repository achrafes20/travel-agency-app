package com.agence.voyage.repository;

import com.agence.voyage.entity.Review;
import com.agence.voyage.entity.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByOfferIdAndStatus(Long offerId, ReviewStatus status, Pageable pageable);

    List<Review> findByOfferIdAndStatus(Long offerId, ReviewStatus status);

    List<Review> findByOfferId(Long offerId);

    Page<Review> findByStatus(ReviewStatus status, Pageable pageable);

    Page<Review> findByReportCountGreaterThanEqual(int minReports, Pageable pageable);

    boolean existsByBookingIdAndOfferId(Long bookingId, Long offerId);

    Page<Review> findByClientId(Long clientId, Pageable pageable);

    long countByOfferIdAndStatus(Long offerId, ReviewStatus status);

    long countByOfferIdAndStatusAndRating(Long offerId, ReviewStatus status, Integer rating);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.offer.id = :offerId AND r.status = :status")
    Double findAverageRatingByOfferIdAndStatus(@Param("offerId") Long offerId, @Param("status") ReviewStatus status);
}

