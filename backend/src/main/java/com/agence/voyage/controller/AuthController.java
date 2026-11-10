package com.agence.voyage.controller;

import com.agence.voyage.dto.AuthResponse;
import com.agence.voyage.dto.LoginRequest;
import com.agence.voyage.dto.RegisterRequest;
import com.agence.voyage.dto.UserResponse;
import com.agence.voyage.entity.User;
import com.agence.voyage.security.AppUserDetails;
import com.agence.voyage.security.CookieAuthHelper;
import com.agence.voyage.security.JwtService;
import com.agence.voyage.service.AuthService;
import com.agence.voyage.service.RefreshTokenService;
import com.agence.voyage.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@io.swagger.v3.oas.annotations.tags.Tag(name = "Authentification", description = "Public : inscription CLIENT et connexion. /me : tout utilisateur authentifié.")
@io.swagger.v3.oas.annotations.responses.ApiResponses({
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Requête invalide", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class))),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Authentification requise", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class))),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Droits insuffisants", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class))),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Ressource introuvable", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class)))
})
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final RefreshTokenService refreshTokenService;
    private final CookieAuthHelper cookieAuthHelper;
    private final JwtService jwtService;

    public AuthController(AuthService authService,
                          UserService userService,
                          RefreshTokenService refreshTokenService,
                          CookieAuthHelper cookieAuthHelper,
                          JwtService jwtService) {
        this.authService = authService;
        this.userService = userService;
        this.refreshTokenService = refreshTokenService;
        this.cookieAuthHelper = cookieAuthHelper;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @io.swagger.v3.oas.annotations.Operation(summary = "Créer un compte client", description = "Public : inscription CLIENT et connexion. /me : tout utilisateur authentifié.")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request,
                                 HttpServletRequest httpRequest,
                                 HttpServletResponse httpResponse) {
        AuthResponse response = authService.register(request);
        User user = userService.findById(response.getUser().getId());
        String rawRefreshToken = refreshTokenService.createRefreshToken(user, httpRequest);
        cookieAuthHelper.setAuthCookies(httpResponse, response.getToken(), rawRefreshToken, true);
        return response;
    }

    @PostMapping("/login")
    @io.swagger.v3.oas.annotations.Operation(summary = "Se connecter", description = "Public : inscription CLIENT et connexion. /me : tout utilisateur authentifié.")
    public AuthResponse login(@Valid @RequestBody LoginRequest request,
                              HttpServletRequest httpRequest,
                              HttpServletResponse httpResponse) {
        AuthResponse response = authService.login(request);
        User user = userService.findById(response.getUser().getId());
        String rawRefreshToken = refreshTokenService.createRefreshToken(user, httpRequest, request.getRememberMe());
        cookieAuthHelper.setAuthCookies(httpResponse, response.getToken(), rawRefreshToken, request.getRememberMe());
        return response;
    }

    @PostMapping("/refresh")
    @io.swagger.v3.oas.annotations.Operation(summary = "Rafraîchir le jeton d'accès", description = "Rotation du jeton de rafraîchissement et émission d'un nouvel access token.")
    public AuthResponse refresh(HttpServletRequest httpRequest,
                                HttpServletResponse httpResponse) {
        String rawToken = cookieAuthHelper.extractRefreshToken(httpRequest);
        RefreshTokenService.RotationResult result = refreshTokenService.rotateRefreshToken(rawToken, httpRequest);
        String newAccessToken = jwtService.generateToken(result.user());
        cookieAuthHelper.setAuthCookies(httpResponse, newAccessToken, result.newRawToken(), result.rememberMe());
        return new AuthResponse(newAccessToken, UserResponse.from(result.user()));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @io.swagger.v3.oas.annotations.Operation(summary = "Se déconnecter", description = "Révoque le jeton de rafraîchissement courant et efface les cookies.")
    public void logout(HttpServletRequest httpRequest,
                       HttpServletResponse httpResponse) {
        String rawToken = cookieAuthHelper.extractRefreshToken(httpRequest);
        if (rawToken != null) {
            refreshTokenService.revokeToken(rawToken);
        }
        cookieAuthHelper.clearAuthCookies(httpResponse);
    }

    @PostMapping("/logout-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @io.swagger.v3.oas.annotations.Operation(summary = "Se déconnecter de tous les appareils", description = "Révoque tous les jetons de rafraîchissement de l'utilisateur et invalide ses JWT.")
    public void logoutAll(@AuthenticationPrincipal AppUserDetails principal,
                          HttpServletResponse httpResponse) {
        if (principal != null) {
            refreshTokenService.revokeAllForUser(principal.getId());
        }
        cookieAuthHelper.clearAuthCookies(httpResponse);
    }

    @GetMapping("/me")
    @io.swagger.v3.oas.annotations.Operation(summary = "Consulter son compte", description = "Public : inscription CLIENT et connexion. /me : tout utilisateur authentifié.")
    public UserResponse me(@AuthenticationPrincipal AppUserDetails principal) {
        return UserResponse.from(userService.findById(principal.getId()));
    }
}
