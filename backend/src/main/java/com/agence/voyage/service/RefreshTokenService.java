package com.agence.voyage.service;

import com.agence.voyage.entity.AuditAction;
import com.agence.voyage.entity.RefreshToken;
import com.agence.voyage.entity.User;
import com.agence.voyage.exception.ErrorCode;
import com.agence.voyage.exception.UnauthorizedException;
import com.agence.voyage.repository.RefreshTokenRepository;
import com.agence.voyage.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.Nullable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Value("${app.jwt.refresh-ttl-days:7}")
    private long refreshTtlDays;

    public record RotationResult(String newRawToken, User user, boolean rememberMe) {}

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
                               UserRepository userRepository,
                               @Nullable AuditService auditService) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    public static String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Algorithme SHA-256 non disponible", e);
        }
    }

    @Transactional
    public String createRefreshToken(User user, @Nullable HttpServletRequest request) {
        return createRefreshToken(user, request, true);
    }

    @Transactional
    public String createRefreshToken(User user, @Nullable HttpServletRequest request, boolean rememberMe) {
        String rawToken = generateSecureToken();
        String tokenHash = hashToken(rawToken);
        String familyId = UUID.randomUUID().toString();

        LocalDateTime expiresAt = LocalDateTime.now().plusDays(refreshTtlDays);
        String ip = extractIp(request);
        String ua = extractUserAgent(request);

        RefreshToken token = new RefreshToken(user.getId(), tokenHash, familyId, expiresAt, ip, ua);
        token.setRememberMe(rememberMe);
        refreshTokenRepository.save(token);

        log.debug("refresh_token_created userId={} familyId={}", user.getId(), familyId);
        return rawToken;
    }

    @Transactional(noRollbackFor = {UnauthorizedException.class})
    public RotationResult rotateRefreshToken(String rawToken, @Nullable HttpServletRequest request) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new UnauthorizedException(ErrorCode.UNAUTHORIZED, "Jeton de rafraîchissement absent");
        }

        String tokenHash = hashToken(rawToken);
        RefreshToken currentToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new UnauthorizedException(ErrorCode.UNAUTHORIZED, "Jeton de rafraîchissement invalide"));

        // DÉTECTION DE RÉUTILISATION : si déjà révoqué ou déjà remplacé
        if (currentToken.isRevoked() || currentToken.getReplacedBy() != null) {
            String familyId = currentToken.getFamilyId();
            Long userId = currentToken.getUserId();

            log.warn("SECURITY_ALERT: refresh_token_reuse_detected userId={} familyId={}", userId, familyId);

            // Révocation de TOUTE la famille de jetons
            refreshTokenRepository.revokeFamily(familyId, LocalDateTime.now());

            // Révocation de la tokenVersion de l'utilisateur pour invalider immédiatement tous les JWT
            userRepository.findById(userId).ifPresent(user -> {
                user.setTokenVersion(Math.addExact(user.getTokenVersion(), 1));
                userRepository.save(user);
            });

            if (auditService != null) {
                auditService.logAs(userId, "SYSTEM", "SECURITY", "REFRESH_TOKEN_REUSE", "AUTH", userId,
                        "Détection de vol/réutilisation de jeton de rafraîchissement (famille: " + familyId + "). Toutes les sessions de la famille sont révoquées.",
                        null, null);
            }

            throw new UnauthorizedException(ErrorCode.TOKEN_REUSED,
                    "Jeton de rafraîchissement déjà utilisé. Session compromise : toutes les sessions associées sont révoquées.");
        }

        // Vérification d'expiration
        if (currentToken.isExpired()) {
            currentToken.setRevokedAt(LocalDateTime.now());
            refreshTokenRepository.save(currentToken);
            throw new UnauthorizedException(ErrorCode.TOKEN_EXPIRED, "Jeton de rafraîchissement expiré. Connectez-vous à nouveau.");
        }

        // Vérification compte utilisateur
        User user = userRepository.findById(currentToken.getUserId())
                .orElseThrow(() -> new UnauthorizedException(ErrorCode.UNAUTHORIZED, "Utilisateur introuvable"));

        if (user.isArchived()) {
            currentToken.setRevokedAt(LocalDateTime.now());
            refreshTokenRepository.save(currentToken);
            throw new UnauthorizedException(ErrorCode.ACCOUNT_ARCHIVED, "Ce compte est désactivé");
        }

        // Rotation atomique
        String newRawToken = generateSecureToken();
        String newHash = hashToken(newRawToken);

        LocalDateTime now = LocalDateTime.now();
        currentToken.setRevokedAt(now);
        currentToken.setReplacedBy(newHash);
        refreshTokenRepository.save(currentToken);

        String ip = extractIp(request);
        String ua = extractUserAgent(request);

        RefreshToken newToken = new RefreshToken(user.getId(), newHash, currentToken.getFamilyId(),
                now.plusDays(refreshTtlDays), ip, ua);
        newToken.setRememberMe(currentToken.isRememberMe());
        refreshTokenRepository.save(newToken);

        log.debug("refresh_token_rotated userId={} familyId={}", user.getId(), currentToken.getFamilyId());
        return new RotationResult(newRawToken, user, currentToken.isRememberMe());
    }

    @Transactional
    public void revokeToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return;
        String tokenHash = hashToken(rawToken);
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
            token.setRevokedAt(LocalDateTime.now());
            refreshTokenRepository.save(token);
            log.debug("refresh_token_revoked userId={} familyId={}", token.getUserId(), token.getFamilyId());
        });
    }

    @Transactional
    public void revokeAllForUser(Long userId) {
        refreshTokenRepository.revokeAllForUser(userId, LocalDateTime.now());
        userRepository.findById(userId).ifPresent(u -> {
            u.setTokenVersion(Math.addExact(u.getTokenVersion(), 1));
            userRepository.save(u);
        });
        log.info("all_refresh_tokens_revoked userId={}", userId);
    }

    @Scheduled(cron = "0 0 4 * * *") // purge quotidienne à 4h
    @Transactional
    public void purgeOldTokens() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
        int deleted = refreshTokenRepository.purgeOldTokens(cutoff);
        if (deleted > 0) {
            log.info("purged_old_refresh_tokens count={}", deleted);
        }
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String extractIp(HttpServletRequest req) {
        if (req == null) return null;
        String xf = req.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }

    private String extractUserAgent(HttpServletRequest req) {
        if (req == null) return null;
        String ua = req.getHeader("User-Agent");
        return (ua != null && ua.length() > 255) ? ua.substring(0, 255) : ua;
    }
}
