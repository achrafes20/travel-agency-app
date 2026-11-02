package com.agence.voyage.controller;

import com.agence.voyage.dto.PageResponse;
import com.agence.voyage.dto.ReviewCreateRequest;
import com.agence.voyage.dto.ReviewModerateRequest;
import com.agence.voyage.dto.ReviewReplyRequest;
import com.agence.voyage.dto.ReviewResponse;
import com.agence.voyage.dto.ReviewSummaryResponse;
import com.agence.voyage.dto.ReviewUpdateRequest;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.ReviewStatus;
import com.agence.voyage.security.AppUserDetails;
import com.agence.voyage.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@Tag(name = "Avis", description = "Gestion des avis et notations des offres")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/api/offers/{offerId}/reviews")
    @Operation(summary = "Lister les avis publics approuvés d'une offre (paginés)")
    public PageResponse<ReviewResponse> getReviewsForOffer(
            @PathVariable Long offerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "recent") String sort) {
        Page<ReviewResponse> p = reviewService.getReviewsForOffer(offerId, page, size, sort);
        return new PageResponse<>(p.getContent(), p.getNumber(), p.getSize(), p.getTotalElements(), sort);
    }

    @GetMapping("/api/offers/{offerId}/reviews/summary")
    @Operation(summary = "Obtenir la note moyenne et la distribution des avis d'une offre")
    public ReviewSummaryResponse getReviewSummary(@PathVariable Long offerId) {
        return reviewService.getReviewSummary(offerId);
    }

    @PostMapping("/api/offers/{offerId}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Déposer un avis certifié sur une offre (nécessite une réservation terminée)")
    public ReviewResponse createReview(
            @PathVariable Long offerId,
            @Valid @RequestBody ReviewCreateRequest request,
            @AuthenticationPrincipal AppUserDetails user) {
        return reviewService.createReview(offerId, request, user.getEmail());
    }

    @PutMapping("/api/reviews/{reviewId}")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Modifier son propre avis (dans les 48h suivant la publication)")
    public ReviewResponse updateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewUpdateRequest request,
            @AuthenticationPrincipal AppUserDetails user) {
        return reviewService.updateReview(reviewId, request, user.getEmail());
    }

    @DeleteMapping("/api/reviews/{reviewId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    @Operation(summary = "Supprimer un avis (l'auteur ou un administrateur)")
    public void deleteReview(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal AppUserDetails user) {
        boolean isAdmin = user.getRole() == Role.ADMIN;
        reviewService.deleteReview(reviewId, user.getEmail(), isAdmin);
    }

    @PostMapping("/api/reviews/{reviewId}/reply")
    @PreAuthorize("hasAnyRole('SUPPLIER', 'ADMIN')")
    @Operation(summary = "Répondre à un avis (le fournisseur de l'offre ou un administrateur)")
    public ReviewResponse replyToReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewReplyRequest request,
            @AuthenticationPrincipal AppUserDetails user) {
        boolean isAdmin = user.getRole() == Role.ADMIN;
        return reviewService.replyToReview(reviewId, request, user.getEmail(), isAdmin);
    }

    @PostMapping("/api/reviews/{reviewId}/report")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Signaler un avis inapproprié ou abusif")
    public ReviewResponse reportReview(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal AppUserDetails user) {
        return reviewService.reportReview(reviewId, user.getEmail());
    }

    @GetMapping("/api/reviews/moderation")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lister les avis pour la file de modération administrateur")
    public PageResponse<ReviewResponse> getReviewsForModeration(
            @RequestParam(required = false) ReviewStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<ReviewResponse> p = reviewService.getReviewsForModeration(status, page, size);
        return new PageResponse<>(p.getContent(), p.getNumber(), p.getSize(), p.getTotalElements(), "moderation");
    }

    @PostMapping("/api/reviews/{reviewId}/moderate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Modérer un avis (approuver ou rejeter)")
    public ReviewResponse moderateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewModerateRequest request,
            @AuthenticationPrincipal AppUserDetails user) {
        return reviewService.moderateReview(reviewId, request, user.getEmail());
    }
}

