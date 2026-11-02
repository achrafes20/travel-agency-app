package com.agence.voyage.controller;

import com.agence.voyage.dto.CityRequest;
import com.agence.voyage.dto.CityResponse;
import com.agence.voyage.service.CityService;
import com.agence.voyage.service.PaginationSupport;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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

import java.util.Set;

@RestController
@Tag(name = "Villes", description = "GET public ; mutations ADMIN.")
@ApiResponses({
        @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content(schema = @Schema(implementation = com.agence.voyage.dto.ApiError.class))),
        @ApiResponse(responseCode = "401", description = "Authentification requise", content = @Content(schema = @Schema(implementation = com.agence.voyage.dto.ApiError.class))),
        @ApiResponse(responseCode = "403", description = "Droits insuffisants", content = @Content(schema = @Schema(implementation = com.agence.voyage.dto.ApiError.class))),
        @ApiResponse(responseCode = "404", description = "Ressource introuvable", content = @Content(schema = @Schema(implementation = com.agence.voyage.dto.ApiError.class))),
        @ApiResponse(responseCode = "409", description = "Conflit ou doublon", content = @Content(schema = @Schema(implementation = com.agence.voyage.dto.ApiError.class)))
})
@RequestMapping("/api/cities")
public class CityController {

    private final CityService cityService;

    public CityController(CityService cityService) {
        this.cityService = cityService;
    }

    @GetMapping
    @Operation(summary = "Lister les ressources", description = "GET public ; mutations ADMIN.")
    public Object list(@RequestParam(required = false) Integer page,
                       @RequestParam(required = false) Integer size,
                       @RequestParam(required = false) String sort,
                       @RequestParam(required = false) String lang) {
        return PaginationSupport.list(
                cityService.findAllResponses(lang),
                page, size, sort, Set.of("id", "name", "country"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulter la ressource", description = "GET public ; mutations ADMIN.")
    public CityResponse get(@PathVariable Long id) {
        return cityService.findResponseById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Créer la ressource", description = "GET public ; mutations ADMIN.")
    public CityResponse create(@Valid @RequestBody CityRequest request) {
        return CityResponse.from(cityService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier la ressource", description = "GET public ; mutations ADMIN.")
    public CityResponse update(@PathVariable Long id, @Valid @RequestBody CityRequest request) {
        return CityResponse.from(cityService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Supprimer la ressource", description = "GET public ; mutations ADMIN.")
    public void delete(@PathVariable Long id) {
        cityService.delete(id);
    }
}
