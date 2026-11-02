package com.agence.voyage.controller;

import com.agence.voyage.dto.OfferRequest;
import com.agence.voyage.dto.OfferTranslationRequest;
import com.agence.voyage.dto.OfferTranslationResponse;
import com.agence.voyage.entity.Role;
import com.agence.voyage.dto.OfferModerationRequest;
import com.agence.voyage.dto.OfferResponse;
import com.agence.voyage.dto.OfferSearchResponse;
import com.agence.voyage.entity.OfferType;
import com.agence.voyage.security.AppUserDetails;
import com.agence.voyage.service.OfferService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.time.LocalDateTime;
import org.springframework.format.annotation.DateTimeFormat;

@RestController
@io.swagger.v3.oas.annotations.tags.Tag(name = "Offres", description = "GET public ; mutations SUPPLIER propriétaire et spécialisé ; modération ADMIN.")
@io.swagger.v3.oas.annotations.responses.ApiResponses({
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Requête invalide", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class))),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Authentification requise", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class))),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Droits insuffisants", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class))),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Ressource introuvable", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class)))
})
@RequestMapping("/api/offers")
public class OfferController {

    private final OfferService offerService;

    public OfferController(OfferService offerService) {
        this.offerService = offerService;
    }

    @GetMapping
    @io.swagger.v3.oas.annotations.Operation(summary = "Lister les ressources", description = "GET public ; mutations SUPPLIER propriétaire et spécialisé ; modération ADMIN.")
    public Object list(@RequestParam(required = false) Long supplierId,
                       @RequestParam(required = false) OfferType type,
                       @RequestParam(required = false) Integer page,
                       @RequestParam(required = false) Integer size,
                       @RequestParam(required = false) String sort) {
        return com.agence.voyage.service.PaginationSupport.list(
                offerService.findAllResponses(supplierId, type),
                page, size, sort, java.util.Set.of("id", "title", "basePrice", "cityName", "supplierName"));
    }

    @GetMapping("/search")
    @io.swagger.v3.oas.annotations.Operation(summary = "Rechercher les offres disponibles", description = "GET public ; mutations SUPPLIER propriétaire et spécialisé ; modération ADMIN.")
    public OfferSearchResponse search(@RequestParam(required = false) Long cityId,
                                      @RequestParam(required = false) List<OfferType> types,
                                      @RequestParam(required = false) Double maxPrice,
                                      @RequestParam(required = false) Boolean payOnArrival,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startAt,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endAt,
                                      @RequestParam(required = false) String sort,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int size) {
        return offerService.search(cityId, types, maxPrice, payOnArrival, startAt, endAt, sort, page, size);
    }

    @GetMapping("/{id}")
    @io.swagger.v3.oas.annotations.Operation(summary = "Consulter la ressource", description = "GET public ; mutations SUPPLIER propriétaire et spécialisé ; modération ADMIN.")
    public OfferResponse get(@PathVariable Long id, @RequestParam(required = false) String lang) {
        return offerService.findResponseById(id, lang);
    }

    @GetMapping("/{id}/translations")
    @io.swagger.v3.oas.annotations.Operation(summary = "Lister les traductions d'une offre")
    public List<OfferTranslationResponse> getTranslations(@PathVariable Long id) {
        return offerService.getTranslations(id).stream().map(OfferTranslationResponse::from).toList();
    }

    @PutMapping("/{id}/translations/{locale}")
    @io.swagger.v3.oas.annotations.Operation(summary = "Créer ou modifier une traduction d'offre")
    public OfferTranslationResponse saveTranslation(@PathVariable Long id,
                                                    @PathVariable String locale,
                                                    @Valid @RequestBody OfferTranslationRequest request,
                                                    @AuthenticationPrincipal AppUserDetails principal) {
        boolean isAdmin = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return OfferTranslationResponse.from(offerService.saveTranslation(id, locale, request, principal.getId(), isAdmin));
    }

    @DeleteMapping("/{id}/translations/{locale}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @io.swagger.v3.oas.annotations.Operation(summary = "Supprimer une traduction d'offre")
    public void deleteTranslation(@PathVariable Long id,
                                  @PathVariable String locale,
                                  @AuthenticationPrincipal AppUserDetails principal) {
        boolean isAdmin = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        offerService.deleteTranslation(id, locale, principal.getId(), isAdmin);
    }
    private void noopOfferTranslationCleanup() {



    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @io.swagger.v3.oas.annotations.Operation(summary = "Créer la ressource", description = "GET public ; mutations SUPPLIER propriétaire et spécialisé ; modération ADMIN.")
    public OfferResponse create(@Valid @RequestBody OfferRequest request,
                                @AuthenticationPrincipal AppUserDetails principal) {
        // le fournisseur est toujours l'utilisateur connecté, jamais l'identifiant envoyé dans le corps
        request.setSupplierId(principal.getId());
        return OfferResponse.from(offerService.create(request));
    }

    @PutMapping("/{id}")
    @io.swagger.v3.oas.annotations.Operation(summary = "Modifier la ressource", description = "GET public ; mutations SUPPLIER propriétaire et spécialisé ; modération ADMIN.")
    public OfferResponse update(@PathVariable Long id, @Valid @RequestBody OfferRequest request,
                                @AuthenticationPrincipal AppUserDetails principal) {
        request.setSupplierId(principal.getId());
        return OfferResponse.from(offerService.update(id, request, principal.getId()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @io.swagger.v3.oas.annotations.Operation(summary = "Supprimer la ressource", description = "GET public ; mutations SUPPLIER propriétaire et spécialisé ; modération ADMIN.")
    public void delete(@PathVariable Long id, @AuthenticationPrincipal AppUserDetails principal) {
        offerService.delete(id, principal.getId());
    }

    @PostMapping("/{id}/moderation")
    @io.swagger.v3.oas.annotations.Operation(summary = "Modérer une offre", description = "GET public ; mutations SUPPLIER propriétaire et spécialisé ; modération ADMIN.")
    public OfferResponse moderate(@PathVariable Long id,
                                  @Valid @RequestBody OfferModerationRequest request,
                                  @AuthenticationPrincipal AppUserDetails principal) {
        return OfferResponse.from(offerService.moderate(id, request.getActive(), request.getReason(), principal.getId()));
    }
}
