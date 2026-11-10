package com.agence.voyage.security;

import com.agence.voyage.dto.LoginRequest;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.User;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.exception.ErrorCode;
import com.agence.voyage.exception.UnauthorizedException;
import com.agence.voyage.repository.RefreshTokenRepository;
import com.agence.voyage.repository.UserRepository;
import com.agence.voyage.service.AuthService;
import com.agence.voyage.service.GdprService;
import com.agence.voyage.service.RefreshTokenService;
import com.agence.voyage.validation.StrongPasswordValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "spring.flyway.enabled=false")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityPhase10Test {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @Autowired private RefreshTokenService refreshTokenService;
    @Autowired private AuthService authService;
    @Autowired private GdprService gdprService;
    @Autowired private PasswordEncoder passwordEncoder;

    private User testClient;

    @BeforeEach
    void setUp() {
        String email = "phase10-" + UUID.randomUUID() + "@atlasvoyage.ma";
        testClient = new User();
        testClient.setFullName("Test Client Phase10");
        testClient.setEmail(email);
        testClient.setPassword(passwordEncoder.encode("Atlas!SecurePass2026"));
        testClient.setRole(Role.CLIENT);
        testClient.setEmailVerified(true);
        testClient.setArchived(false);
        testClient = userRepository.save(testClient);
    }

    @Test
    void strongPasswordValidationRejectsWeakAndTrivialPasswords() {
        StrongPasswordValidator validator = new StrongPasswordValidator();

        // Trop court (< 12 caractères)
        assertFalse(validator.isValid("Court1!", null));

        // Manque de complexité (uniquement lettres minuscules)
        assertFalse(validator.isValid("motdepassetoutcourt", null));

        // Mot de passe trivial liste noire
        assertFalse(validator.isValid("password12345", null));
        assertFalse(validator.isValid("azerty123456", null));

        // Valide : >= 12 chars, 3/4 catégories
        assertTrue(validator.isValid("Atlas!Voyage2026", null));
        assertTrue(validator.isValid("Complexe#Securite99", null));
    }

    @Test
    void refreshTokenRotationAndReuseDetectionRevokesFamily() {
        // 1. Émission d'un refresh token initial
        String rawToken1 = refreshTokenService.createRefreshToken(testClient, null);
        assertNotNull(rawToken1);
        String tokenHash1 = RefreshTokenService.hashToken(rawToken1);
        var initialEntity = refreshTokenRepository.findByTokenHash(tokenHash1).orElseThrow();
        String familyId = initialEntity.getFamilyId();

        // 2. Rotation légitime avec rawToken1
        var rotatedResult = refreshTokenService.rotateRefreshToken(rawToken1, null);
        String rawToken2 = rotatedResult.newRawToken();
        assertNotEquals(rawToken1, rawToken2);
        String tokenHash2 = RefreshTokenService.hashToken(rawToken2);
        var rotatedEntity = refreshTokenRepository.findByTokenHash(tokenHash2).orElseThrow();
        assertEquals(familyId, rotatedEntity.getFamilyId());

        // 3. Tentative de réutilisation frauduleuse du rawToken1 déjà consommé
        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () ->
                refreshTokenService.rotateRefreshToken(rawToken1, null));
        assertEquals(ErrorCode.TOKEN_REUSED, ex.getCode());

        // 4. Vérification que toute la famille a été révoquée
        var familyTokens = refreshTokenRepository.findByFamilyId(familyId);
        assertFalse(familyTokens.isEmpty());
        for (var token : familyTokens) {
            assertNotNull(token.getRevokedAt(), "Tous les jetons de la famille doivent être révoqués suite à une réutilisation détectée");
        }
    }

    @Test
    void rememberMeChoiceSurvivesTokenRefresh() throws Exception {
        String password = "Atlas!SecurePass2026";

        // Sans « Se souvenir de moi » : cookie de session à la connexion ET après rotation
        var sessionLogin = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + testClient.getEmail() + "\",\"password\":\"" + password + "\",\"rememberMe\":false}"))
                .andExpect(status().isOk()).andReturn();
        var sessionCookie = sessionLogin.getResponse().getCookie(CookieAuthHelper.REFRESH_COOKIE_NAME);
        assertNotNull(sessionCookie);
        assertEquals(-1, sessionCookie.getMaxAge(), "sans « Se souvenir de moi », le cookie doit être un cookie de session");

        var sessionRefresh = mockMvc.perform(post("/api/auth/refresh").cookie(sessionCookie).with(csrf()))
                .andExpect(status().isOk()).andReturn();
        var rotatedSessionCookie = sessionRefresh.getResponse().getCookie(CookieAuthHelper.REFRESH_COOKIE_NAME);
        assertNotNull(rotatedSessionCookie);
        assertEquals(-1, rotatedSessionCookie.getMaxAge(), "la rotation ne doit pas transformer un cookie de session en cookie persistant");

        // Avec « Se souvenir de moi » : cookie persistant à la connexion ET après rotation
        var rememberedLogin = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + testClient.getEmail() + "\",\"password\":\"" + password + "\",\"rememberMe\":true}"))
                .andExpect(status().isOk()).andReturn();
        var rememberedCookie = rememberedLogin.getResponse().getCookie(CookieAuthHelper.REFRESH_COOKIE_NAME);
        assertNotNull(rememberedCookie);
        assertTrue(rememberedCookie.getMaxAge() > 0);

        var rememberedRefresh = mockMvc.perform(post("/api/auth/refresh").cookie(rememberedCookie).with(csrf()))
                .andExpect(status().isOk()).andReturn();
        var rotatedRememberedCookie = rememberedRefresh.getResponse().getCookie(CookieAuthHelper.REFRESH_COOKIE_NAME);
        assertNotNull(rotatedRememberedCookie);
        assertTrue(rotatedRememberedCookie.getMaxAge() > 0);
    }

    @Test
    void accountLockingAfterFiveConsecutiveFailuresAndAdminUnlock() {
        LoginRequest badLogin = new LoginRequest(testClient.getEmail(), "WrongPassword!");

        // 5 tentatives infructueuses
        for (int i = 0; i < 5; i++) {
            assertThrows(UnauthorizedException.class, () -> authService.login(badLogin));
        }

        // Le compte doit maintenant être verrouillé
        User lockedUser = userRepository.findById(testClient.getId()).orElseThrow();
        assertEquals(5, lockedUser.getFailedLoginAttempts());
        assertNotNull(lockedUser.getLockedUntil());
        assertTrue(lockedUser.getLockedUntil().isAfter(LocalDateTime.now(ZoneOffset.UTC)));

        // 6ème tentative : rejetée sans énumération (même message générique)
        UnauthorizedException lockedEx = assertThrows(UnauthorizedException.class, () ->
                authService.login(badLogin));
        assertEquals("Identifiants invalides", lockedEx.getMessage());

        // Déverrouillage par l'administrateur
        authService.unlockUser(testClient.getId());
        User unlockedUser = userRepository.findById(testClient.getId()).orElseThrow();
        assertEquals(0, unlockedUser.getFailedLoginAttempts());
        assertNull(unlockedUser.getLockedUntil());
    }

    @Test
    void gdprExportReturnsCompletePersonalData() {
        Map<String, Object> export = gdprService.exportUserData(testClient.getId());
        assertNotNull(export);
        assertTrue(export.containsKey("profile"));
        assertTrue(export.containsKey("favorites"));
        assertTrue(export.containsKey("bookings"));
        assertTrue(export.containsKey("payments"));
        assertTrue(export.containsKey("tickets"));

        @SuppressWarnings("unchecked")
        Map<String, Object> profile = (Map<String, Object>) export.get("profile");
        assertEquals(testClient.getEmail(), profile.get("email"));
        assertEquals(testClient.getFullName(), profile.get("fullName"));
        // Vérification qu'aucun secret ou hash n'est fuité
        assertFalse(profile.containsKey("password"));
        assertFalse(profile.containsKey("tokenVersion"));
    }

    @Test
    void gdprAccountAnonymizationAndDeletionWithPasswordConfirmation() {
        // Mauvais mot de passe : rejeté
        assertThrows(BusinessException.class, () ->
                gdprService.anonymizeUser(testClient.getId(), "WrongPassword123!"));

        // Bon mot de passe : anonymisation
        gdprService.anonymizeUser(testClient.getId(), "Atlas!SecurePass2026");

        User anonymized = userRepository.findById(testClient.getId()).orElseThrow();
        assertTrue(anonymized.isArchived());
        assertEquals("Utilisateur supprimé", anonymized.getFullName());
        assertTrue(anonymized.getEmail().startsWith("deleted-"));
        assertTrue(anonymized.getEmail().endsWith("@anonymized.atlasvoyage.ma"));
        assertNull(anonymized.getPhone());
        assertNull(anonymized.getAvatarUrl());
    }

    @Test
    void actuatorPublicHealthAndInfoAccessible() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").exists());

        mockMvc.perform(get("/actuator/info"))
                .andExpect(status().isOk());
    }
}
