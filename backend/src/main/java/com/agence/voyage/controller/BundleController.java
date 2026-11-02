package com.agence.voyage.controller;

import com.agence.voyage.dto.BundleRequest;
import com.agence.voyage.dto.BundleResponse;
import com.agence.voyage.security.AppUserDetails;
import com.agence.voyage.service.BundleService;
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

@RestController
@io.swagger.v3.oas.annotations.tags.Tag(name = "Bundles", description = "GET public ; mutations AGENT créateur.")
@io.swagger.v3.oas.annotations.responses.ApiResponses({
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Requête invalide", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class))),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Authentification requise", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class))),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Droits insuffisants", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class))),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Ressource introuvable", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class)))
})
@RequestMapping("/api/bundles")
public class BundleController {

    private final BundleService bundleService;

    public BundleController(BundleService bundleService) {
        this.bundleService = bundleService;
    }

    @GetMapping
    @io.swagger.v3.oas.annotations.Operation(summary = "Lister les ressources", description = "GET public ; mutations AGENT créateur.")
    public Object list(@RequestParam(required = false) Long agentId,
                       @RequestParam(required = false) Integer page,
                       @RequestParam(required = false) Integer size,
                       @RequestParam(required = false) String sort) {
        return com.agence.voyage.service.PaginationSupport.list(
                bundleService.findAll(agentId).stream().map(BundleResponse::from).toList(),
                page, size, sort, java.util.Set.of("id", "title", "finalPrice"));
    }

    @GetMapping("/{id}")
    @io.swagger.v3.oas.annotations.Operation(summary = "Consulter la ressource", description = "GET public ; mutations AGENT créateur.")
    public BundleResponse get(@PathVariable Long id) {
        return BundleResponse.from(bundleService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @io.swagger.v3.oas.annotations.Operation(summary = "Créer la ressource", description = "GET public ; mutations AGENT créateur.")
    public BundleResponse create(@Valid @RequestBody BundleRequest request,
                                 @AuthenticationPrincipal AppUserDetails principal) {
        // le créateur est toujours l'agent connecté, jamais l'identifiant envoyé dans le corps
        request.setCreatedById(principal.getId());
        return BundleResponse.from(bundleService.create(request));
    }

    @PutMapping("/{id}")
    @io.swagger.v3.oas.annotations.Operation(summary = "Modifier la ressource", description = "GET public ; mutations AGENT créateur.")
    public BundleResponse update(@PathVariable Long id, @Valid @RequestBody BundleRequest request,
                                 @AuthenticationPrincipal AppUserDetails principal) {
        request.setCreatedById(principal.getId());
        return BundleResponse.from(bundleService.update(id, request, principal.getId()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @io.swagger.v3.oas.annotations.Operation(summary = "Supprimer la ressource", description = "GET public ; mutations AGENT créateur.")
    public void delete(@PathVariable Long id, @AuthenticationPrincipal AppUserDetails principal) {
        bundleService.delete(id, principal.getId());
    }
}
