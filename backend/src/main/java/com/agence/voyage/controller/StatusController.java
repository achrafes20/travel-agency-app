package com.agence.voyage.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@io.swagger.v3.oas.annotations.tags.Tag(name = "Statut", description = "Public.")
@io.swagger.v3.oas.annotations.responses.ApiResponses({
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Requête invalide", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class))),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Authentification requise", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class))),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Droits insuffisants", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class))),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Ressource introuvable", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class)))
})
@RequestMapping("/api/status")
public class StatusController {

    @GetMapping
    @io.swagger.v3.oas.annotations.Operation(summary = "Vérifier le statut de l’API", description = "Public.")
    public Map<String, Object> status() {
        return Map.of(
                "status", "ok",
                "message", "Backend Atlas Voyage connecte avec succes.",
                "timestamp", LocalDateTime.now().toString()
        );
    }
}
