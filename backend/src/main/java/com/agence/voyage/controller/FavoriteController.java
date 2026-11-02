package com.agence.voyage.controller;

import com.agence.voyage.dto.FavoriteIdsResponse;
import com.agence.voyage.dto.FavoriteResponse;
import com.agence.voyage.dto.PageResponse;
import com.agence.voyage.security.AppUserDetails;
import com.agence.voyage.service.FavoriteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/favorites")
@Tag(name = "Favoris", description = "Gestion des offres favorites des clients")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping
    @Operation(summary = "Lister les offres favorites du client connectǸ (paginǸe)")
    public PageResponse<FavoriteResponse> list(
            @AuthenticationPrincipal AppUserDetails user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), 50);
        Page<FavoriteResponse> result = favoriteService.list(
                user.getId(),
                PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return new PageResponse<>(
                result.getContent(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                "createdAt,desc"
        );
    }

    @GetMapping("/ids")
    @Operation(summary = "Obtenir la liste des IDs des offres favorites du client connectǸ")
    public FavoriteIdsResponse listIds(@AuthenticationPrincipal AppUserDetails user) {
        return new FavoriteIdsResponse(favoriteService.listIds(user.getId()));
    }

    @PostMapping("/{offerId}")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Ajouter une offre aux favoris")
    public FavoriteResponse add(
            @AuthenticationPrincipal AppUserDetails user,
            @PathVariable Long offerId) {
        return favoriteService.add(user.getId(), offerId);
    }

    @DeleteMapping("/{offerId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Retirer une offre des favoris")
    public void remove(
            @AuthenticationPrincipal AppUserDetails user,
            @PathVariable Long offerId) {
        favoriteService.remove(user.getId(), offerId);
    }
}
