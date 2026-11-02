package com.agence.voyage.controller;

import com.agence.voyage.dto.PromoCodeRequest;
import com.agence.voyage.dto.PromoCodeResponse;
import com.agence.voyage.service.PromoCodeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@io.swagger.v3.oas.annotations.tags.Tag(name = "Codes promo", description = "ADMIN uniquement.")
@io.swagger.v3.oas.annotations.responses.ApiResponses({
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Requête invalide", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class))),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Authentification requise", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class))),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Droits insuffisants", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class))),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Ressource introuvable", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class)))
})
@RequestMapping("/api/promo-codes")
public class PromoCodeController {

    private final PromoCodeService promoCodeService;

    public PromoCodeController(PromoCodeService promoCodeService) {
        this.promoCodeService = promoCodeService;
    }

    @GetMapping
    @io.swagger.v3.oas.annotations.Operation(summary = "Lister les ressources", description = "ADMIN uniquement.")
    public Object list(@org.springframework.web.bind.annotation.RequestParam(required = false) Integer page,
                       @org.springframework.web.bind.annotation.RequestParam(required = false) Integer size,
                       @org.springframework.web.bind.annotation.RequestParam(required = false) String sort) {
        return com.agence.voyage.service.PaginationSupport.list(
                promoCodeService.findAll().stream().map(PromoCodeResponse::from).toList(),
                page, size, sort, java.util.Set.of("id","code","expiryDate"));
    }

    @GetMapping("/{id}")
    @io.swagger.v3.oas.annotations.Operation(summary = "Consulter la ressource", description = "ADMIN uniquement.")
    public PromoCodeResponse get(@PathVariable Long id) {
        return PromoCodeResponse.from(promoCodeService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @io.swagger.v3.oas.annotations.Operation(summary = "Créer la ressource", description = "ADMIN uniquement.")
    public PromoCodeResponse create(@Valid @RequestBody PromoCodeRequest request) {
        return PromoCodeResponse.from(promoCodeService.create(request));
    }

    @PutMapping("/{id}")
    @io.swagger.v3.oas.annotations.Operation(summary = "Modifier la ressource", description = "ADMIN uniquement.")
    public PromoCodeResponse update(@PathVariable Long id, @Valid @RequestBody PromoCodeRequest request) {
        return PromoCodeResponse.from(promoCodeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @io.swagger.v3.oas.annotations.Operation(summary = "Supprimer la ressource", description = "ADMIN uniquement.")
    public void delete(@PathVariable Long id) {
        promoCodeService.delete(id);
    }
}
