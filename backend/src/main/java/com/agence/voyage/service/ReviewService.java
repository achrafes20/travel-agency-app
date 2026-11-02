package com.agence.voyage.service;

import com.agence.voyage.dto.ReviewCreateRequest;
import com.agence.voyage.dto.ReviewModerateRequest;
import com.agence.voyage.dto.ReviewReplyRequest;
import com.agence.voyage.dto.ReviewResponse;
import com.agence.voyage.dto.ReviewSummaryResponse;
import com.agence.voyage.dto.ReviewUpdateRequest;
import com.agence.voyage.entity.*;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.exception.ErrorCode;
import com.agence.voyage.exception.ForbiddenException;
import com.agence.voyage.exception.ResourceNotFoundException;
import com.agence.voyage.repository.BookingRepository;
import com.agence.voyage.repository.OfferRepository;
import com.agence.voyage.repository.ReviewRepository;
import com.agence.voyage.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class ReviewService {

    private static final Logger log = LoggerFactory.getLogger(ReviewService.class);

    private static final List<String> SENSITIVE_WORDS = List.of(
            "arnaque", "arnaqueur", "escroc", "escroquerie", "voleur", "voleurs", "honteux",
            "merde", "putain", "connard", "connasse", "salaud", "salope", "bordel", "foutre",
            "batard", "encule", "fuck", "shit", "scam", "bastard", "zebi", "nik", "kelb", "hmar", "cheffar"
    );

    private final ReviewRepository reviewRepository;
    private final OfferRepository offerRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Autowired
    public ReviewService(ReviewRepository reviewRepository,
                         OfferRepository offerRepository,
                         BookingRepository bookingRepository,
                         UserRepository userRepository,
                         @Nullable AuditService auditService) {
        this.reviewRepository = reviewRepository;
        this.offerRepository = offerRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional
    public ReviewResponse createReview(Long offerId, ReviewCreateRequest req, String clientEmail) {
        User client = userRepository.findByEmailIgnoreCase(clientEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : " + clientEmail));

        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offre introuvable : id=" + offerId));

        Booking booking = bookingRepository.findById(req.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Réservation introuvable : id=" + req.getBookingId()));

        if (!booking.getClient().getId().equals(client.getId())) {
            throw new ForbiddenException("Vous ne pouvez déposer un avis que pour vos propres réservations");
        }

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Vous ne pouvez déposer un avis que pour une réservation terminée (statut COMPLETED)");
        }

        boolean containsOffer = booking.getItems().stream().anyMatch(item ->
                (item.getOffer() != null && item.getOffer().getId().equals(offerId)) ||
                (item.getBundle() != null && item.getBundle().getOffers() != null &&
                        item.getBundle().getOffers().stream().anyMatch(o -> o.getId().equals(offerId)))
        );

        if (!containsOffer) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Cette réservation ne contient pas l'offre indiquée");
        }

        if (reviewRepository.existsByBookingIdAndOfferId(booking.getId(), offer.getId())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Vous avez déjà déposé un avis pour cette réservation et cette offre");
        }

        Review review = new Review();
        review.setOffer(offer);
        review.setClient(client);
        review.setBooking(booking);
        review.setRating(req.getRating());
        review.setTitle(req.getTitle().trim());
        review.setComment(req.getComment().trim());

        if (containsSensitiveWords(req.getTitle()) || containsSensitiveWords(req.getComment())) {
            review.setStatus(ReviewStatus.PENDING);
            review.setModerationReason("Détection automatique de termes sensibles - en attente de modération admin");
        } else {
            review.setStatus(ReviewStatus.APPROVED);
        }

        Review saved = reviewRepository.save(review);

        if (saved.getStatus() == ReviewStatus.APPROVED) {
            recalculateOfferRatings(offer);
        }

        log.info("Avis créé : reviewId={}, offerId={}, clientId={}, status={}",
                saved.getId(), offer.getId(), client.getId(), saved.getStatus());

        return ReviewResponse.from(saved);
    }

    @Transactional
    public ReviewResponse updateReview(Long reviewId, ReviewUpdateRequest req, String clientEmail) {
        User client = userRepository.findByEmailIgnoreCase(clientEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : " + clientEmail));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Avis introuvable : id=" + reviewId));

        if (!review.getClient().getId().equals(client.getId())) {
            throw new ForbiddenException("Vous ne pouvez modifier que vos propres avis");
        }

        if (review.getStatus() == ReviewStatus.APPROVED &&
                review.getCreatedAt().isBefore(LocalDateTime.now().minusHours(48))) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "La période de modification de 48 heures après publication est expirée");
        }

        review.setRating(req.getRating());
        review.setTitle(req.getTitle().trim());
        review.setComment(req.getComment().trim());

        if (containsSensitiveWords(req.getTitle()) || containsSensitiveWords(req.getComment())) {
            review.setStatus(ReviewStatus.PENDING);
            review.setModerationReason("Mise à jour avec termes sensibles - en attente de modération admin");
        }

        Review saved = reviewRepository.save(review);
        recalculateOfferRatings(review.getOffer());

        return ReviewResponse.from(saved);
    }

    @Transactional
    public void deleteReview(Long reviewId, String userEmail, boolean isAdmin) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : " + userEmail));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Avis introuvable : id=" + reviewId));

        if (!isAdmin && !review.getClient().getId().equals(user.getId())) {
            throw new ForbiddenException("Vous n'êtes pas autorisé à supprimer cet avis");
        }

        Offer offer = review.getOffer();
        reviewRepository.delete(review);
        recalculateOfferRatings(offer);

        log.info("Avis supprimé : reviewId={}, par={}", reviewId, userEmail);
    }

    @Transactional
    public ReviewResponse replyToReview(Long reviewId, ReviewReplyRequest req, String userEmail, boolean isAdmin) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : " + userEmail));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Avis introuvable : id=" + reviewId));

        Offer offer = review.getOffer();
        if (!isAdmin && (offer.getSupplier() == null || !offer.getSupplier().getId().equals(user.getId()))) {
            throw new ForbiddenException("Seul le fournisseur de l'offre ou un administrateur peut répondre à cet avis");
        }

        review.setSupplierReply(req.getReply().trim());
        review.setSupplierRepliedAt(LocalDateTime.now());
        Review saved = reviewRepository.save(review);

        log.info("Réponse fournisseur ajoutée : reviewId={}, supplierId={}", reviewId, user.getId());
        return ReviewResponse.from(saved);
    }

    @Transactional
    public ReviewResponse reportReview(Long reviewId, String userEmail) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Avis introuvable : id=" + reviewId));

        review.setReportCount(review.getReportCount() + 1);

        if (review.getReportCount() >= 3 && review.getStatus() == ReviewStatus.APPROVED) {
            review.setStatus(ReviewStatus.PENDING);
            review.setModerationReason("Signalé par plusieurs utilisateurs (" + review.getReportCount() + " signalements)");
            recalculateOfferRatings(review.getOffer());
        }

        Review saved = reviewRepository.save(review);
        log.info("Avis signalé : reviewId={}, reportCount={}, status={}", reviewId, saved.getReportCount(), saved.getStatus());
        return ReviewResponse.from(saved);
    }

    @Transactional
    public ReviewResponse moderateReview(Long reviewId, ReviewModerateRequest req, String adminEmail) {
        User admin = userRepository.findByEmailIgnoreCase(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Administrateur introuvable : " + adminEmail));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Avis introuvable : id=" + reviewId));

        review.setStatus(req.getStatus());
        review.setModeratedBy(admin);
        review.setModeratedAt(LocalDateTime.now());
        review.setModerationReason(req.getReason() != null ? req.getReason().trim() : null);

        Review saved = reviewRepository.save(review);
        recalculateOfferRatings(review.getOffer());

        if (auditService != null) {
            auditService.log(AuditAction.REVIEW_MODERATED, "REVIEW", review.getId(),
                    "Modération de l'avis : nouveau statut=" + req.getStatus() + ", motif=" + req.getReason(), null, null);
        }

        log.info("Avis modéré : reviewId={}, statut={}, admin={}", reviewId, req.getStatus(), adminEmail);
        return ReviewResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getReviewsForOffer(Long offerId, int page, int size, String sort) {
        Sort sorting = switch (sort != null ? sort : "recent") {
            case "rating_desc" -> Sort.by(Sort.Direction.DESC, "rating").and(Sort.by(Sort.Direction.DESC, "createdAt"));
            case "rating_asc" -> Sort.by(Sort.Direction.ASC, "rating").and(Sort.by(Sort.Direction.DESC, "createdAt"));
            case "oldest" -> Sort.by(Sort.Direction.ASC, "createdAt");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)), sorting);
        return reviewRepository.findByOfferIdAndStatus(offerId, ReviewStatus.APPROVED, pageable)
                .map(ReviewResponse::from);
    }

    @Transactional(readOnly = true)
    public ReviewSummaryResponse getReviewSummary(Long offerId) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offre introuvable : id=" + offerId));

        List<Review> approvedReviews = reviewRepository.findByOfferIdAndStatus(offerId, ReviewStatus.APPROVED);
        long total = approvedReviews.size();

        Map<Integer, Long> distribution = new LinkedHashMap<>();
        Map<Integer, Double> percentages = new LinkedHashMap<>();

        for (int star = 5; star >= 1; star--) {
            int finalStar = star;
            long count = approvedReviews.stream().filter(r -> r.getRating() == finalStar).count();
            distribution.put(star, count);
            double pct = total > 0 ? Math.round((count * 100.0 / total) * 10.0) / 10.0 : 0.0;
            percentages.put(star, pct);
        }

        double avg = total > 0 ?
                Math.round(approvedReviews.stream().mapToInt(Review::getRating).average().orElse(0.0) * 10.0) / 10.0
                : 0.0;

        return new ReviewSummaryResponse(offerId, avg, total, distribution, percentages);
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getReviewsForModeration(ReviewStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)),
                Sort.by(Sort.Direction.DESC, "reportCount").and(Sort.by(Sort.Direction.DESC, "createdAt")));

        if (status != null) {
            return reviewRepository.findByStatus(status, pageable).map(ReviewResponse::from);
        } else {
            return reviewRepository.findAll(pageable).map(ReviewResponse::from);
        }
    }

    @Transactional
    public void recalculateOfferRatings(Offer offer) {
        if (offer == null) return;
        List<Review> approved = reviewRepository.findByOfferIdAndStatus(offer.getId(), ReviewStatus.APPROVED);
        if (approved.isEmpty()) {
            offer.setAverageRating(0.0);
            offer.setReviewCount(0);
        } else {
            double avg = approved.stream().mapToInt(Review::getRating).average().orElse(0.0);
            offer.setAverageRating(Math.round(avg * 10.0) / 10.0);
            offer.setReviewCount(approved.size());
        }
        offerRepository.save(offer);
    }

    private boolean containsSensitiveWords(String text) {
        if (text == null || text.isBlank()) return false;
        String lower = text.toLowerCase(Locale.FRENCH);
        for (String word : SENSITIVE_WORDS) {
            Pattern pattern = Pattern.compile("\\b" + Pattern.quote(word) + "\\b", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
            if (pattern.matcher(lower).find()) {
                return true;
            }
        }
        return false;
    }
}
