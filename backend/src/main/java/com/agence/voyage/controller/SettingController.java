package com.agence.voyage.controller;

import com.agence.voyage.dto.PublicSettingsResponse;
import com.agence.voyage.dto.SettingBulkUpdateRequest;
import com.agence.voyage.dto.SettingUpdateRequest;
import org.springframework.web.bind.annotation.PathVariable;
import com.agence.voyage.dto.SettingResponse;
import com.agence.voyage.security.AppUserDetails;
import com.agence.voyage.service.SettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/settings")
@Tag(name = "Paramtres", description = "Gestion des paramtres globaux de la plateforme")
public class SettingController {

    private final SettingService settingService;

    public SettingController(SettingService settingService) {
        this.settingService = settingService;
    }

    @GetMapping
    @Operation(summary = "Obtenir la liste complte des paramtres systme (ADMIN)")
    public List<SettingResponse> getAll() {
        return settingService.getAll();
    }

    @PutMapping("/{key}")
    @Operation(summary = "Mise à jour unitaire d'un paramètre (ADMIN)")
    public SettingResponse update(
            @PathVariable String key,
            @AuthenticationPrincipal AppUserDetails user,
            @Valid @RequestBody SettingUpdateRequest request) {
        String actor = user != null ? user.getUsername() : "ADMIN";
        return settingService.update(key, request.value(), actor);
    }

    @PutMapping
    @Operation(summary = "Mise  jour groupe et atomique des paramtres (ADMIN)")
    public List<SettingResponse> updateAll(
            @AuthenticationPrincipal AppUserDetails user,
            @Valid @RequestBody SettingBulkUpdateRequest request) {
        String actor = user != null ? user.getUsername() : "ADMIN";
        return settingService.updateAll(request.settings(), actor);
    }

    @GetMapping("/public")
    @Operation(summary = "Obtenir les paramtres publics non sensibles")
    public PublicSettingsResponse getPublicSettings() {
        return settingService.getPublicSettings();
    }
}
