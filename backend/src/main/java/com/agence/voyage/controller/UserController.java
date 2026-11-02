package com.agence.voyage.controller;

import com.agence.voyage.dto.DeleteAccountRequest;
import com.agence.voyage.dto.UserRequest;
import com.agence.voyage.dto.UserResponse;
import com.agence.voyage.security.AppUserDetails;
import com.agence.voyage.security.CookieAuthHelper;
import com.agence.voyage.service.AuthService;
import com.agence.voyage.service.GdprService;
import com.agence.voyage.service.UserService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@io.swagger.v3.oas.annotations.tags.Tag(name = "Utilisateurs", description = "Gestion des utilisateurs et conformité RGPD.")
@io.swagger.v3.oas.annotations.responses.ApiResponses({
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Requête invalide", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class))),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Authentification requise", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class))),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Droits insuffisants", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class))),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Ressource introuvable", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class)))
})
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final AuthService authService;
    private final GdprService gdprService;
    private final CookieAuthHelper cookieAuthHelper;

    public UserController(UserService userService,
                          AuthService authService,
                          GdprService gdprService,
                          CookieAuthHelper cookieAuthHelper) {
        this.userService = userService;
        this.authService = authService;
        this.gdprService = gdprService;
        this.cookieAuthHelper = cookieAuthHelper;
    }

    @GetMapping("/me/export")
    @io.swagger.v3.oas.annotations.Operation(summary = "Exporter ses données personnelles (RGPD / Loi 09-08 CNDP)")
    public ResponseEntity<Map<String, Object>> exportMe(@AuthenticationPrincipal AppUserDetails u) {
        Map<String, Object> data = gdprService.exportUserData(u.getId());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"atlas-voyage-data-" + u.getId() + ".json\"")
                .body(data);
    }

    @DeleteMapping("/me")
    @io.swagger.v3.oas.annotations.Operation(summary = "Supprimer son compte et anonymiser ses données (RGPD / Loi 09-08 CNDP)")
    public ResponseEntity<Map<String, String>> deleteMe(@AuthenticationPrincipal AppUserDetails u,
                                                        @Valid @RequestBody DeleteAccountRequest request,
                                                        HttpServletResponse response) {
        gdprService.anonymizeUser(u.getId(), request.password());
        cookieAuthHelper.clearAuthCookies(response);
        return ResponseEntity.ok(Map.of("message", "Votre compte et vos données personnelles ont été anonymisés et supprimés avec succès"));
    }

    @GetMapping
    @io.swagger.v3.oas.annotations.Operation(summary = "Lister les ressources", description = "ADMIN uniquement.")
    public Object list(@org.springframework.web.bind.annotation.RequestParam(required = false) Integer page,
                       @org.springframework.web.bind.annotation.RequestParam(required = false) Integer size,
                       @org.springframework.web.bind.annotation.RequestParam(required = false) String sort) {
        return com.agence.voyage.service.PaginationSupport.list(
                userService.getAllUsers().stream().map(UserResponse::from).toList(),
                page, size, sort, java.util.Set.of("id","fullName","email","role"));
    }

    @GetMapping("/{id}")
    @io.swagger.v3.oas.annotations.Operation(summary = "Consulter la ressource", description = "ADMIN uniquement.")
    public UserResponse get(@PathVariable Long id) {
        return UserResponse.from(userService.findById(id));
    }

    @PutMapping("/me/preferences")
    @io.swagger.v3.oas.annotations.Operation(summary = "Mettre à jour les préférences de langue et devise de l'utilisateur")
    public UserResponse updatePreferences(@AuthenticationPrincipal AppUserDetails userDetails,
                                          @Valid @RequestBody com.agence.voyage.dto.UserPreferencesRequest request) {
        if (userDetails == null) {
            throw new com.agence.voyage.exception.UnauthorizedException(com.agence.voyage.exception.ErrorCode.UNAUTHORIZED, "Non authentifié");
        }
        return UserResponse.from(userService.updatePreferences(userDetails.getId(), request));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @io.swagger.v3.oas.annotations.Operation(summary = "Créer la ressource", description = "ADMIN uniquement.")
    public UserResponse create(@Valid @RequestBody UserRequest request) {
        return UserResponse.from(userService.create(request));
    }

    @PutMapping("/{id}")
    @io.swagger.v3.oas.annotations.Operation(summary = "Modifier la ressource", description = "ADMIN uniquement.")
    public UserResponse update(@PathVariable Long id, @Valid @RequestBody UserRequest request) {
        return UserResponse.from(userService.update(id, request));
    }

    @PostMapping("/{id}/archive")
    @io.swagger.v3.oas.annotations.Operation(summary = "Archiver un compte", description = "ADMIN uniquement.")
    public UserResponse archive(@PathVariable Long id) {
        return UserResponse.from(userService.archive(id));
    }

    @PostMapping("/{id}/restore")
    @io.swagger.v3.oas.annotations.Operation(summary = "Restaurer un compte", description = "ADMIN uniquement.")
    public UserResponse restore(@PathVariable Long id) {
        return UserResponse.from(userService.restore(id));
    }

    @PostMapping("/{id}/unlock")
    @io.swagger.v3.oas.annotations.Operation(summary = "Déverrouiller un compte", description = "ADMIN uniquement.")
    public UserResponse unlock(@PathVariable Long id) {
        authService.unlockUser(id);
        return UserResponse.from(userService.findById(id));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @io.swagger.v3.oas.annotations.Operation(summary = "Supprimer la ressource", description = "ADMIN uniquement.")
    public void delete(@PathVariable Long id) {
        userService.delete(id);
    }
}
