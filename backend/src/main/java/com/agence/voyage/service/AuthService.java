package com.agence.voyage.service;

import com.agence.voyage.dto.AuthResponse;
import com.agence.voyage.dto.LoginRequest;
import com.agence.voyage.dto.RegisterRequest;
import com.agence.voyage.dto.UserRequest;
import com.agence.voyage.dto.UserResponse;
import com.agence.voyage.entity.AuditAction;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.User;
import com.agence.voyage.exception.ErrorCode;
import com.agence.voyage.exception.ResourceNotFoundException;
import com.agence.voyage.exception.UnauthorizedException;
import com.agence.voyage.repository.UserRepository;
import com.agence.voyage.security.JwtService;
import com.agence.voyage.security.RateLimitingService;
import org.springframework.lang.Nullable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final NotificationEvents notifications;
    private final com.agence.voyage.config.AuthAccountProperties properties;
    private final org.springframework.context.ApplicationEventPublisher publisher;
    private final AuditService auditService;
    private final RateLimitingService rateLimitingService;

    public AuthService(UserRepository userRepository, UserService userService,
                       PasswordEncoder passwordEncoder, JwtService jwtService,
                       org.springframework.context.ApplicationEventPublisher publisher,
                       com.agence.voyage.config.AuthAccountProperties properties,
                       @Nullable AuditService auditService,
                       @Nullable RateLimitingService rateLimitingService) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.notifications = new NotificationEvents(publisher);
        this.properties = properties;
        this.publisher = publisher;
        this.auditService = auditService;
        this.rateLimitingService = rateLimitingService;
    }

    /** Inscription publique : le rôle est toujours CLIENT, quoi que le client envoie. */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (rateLimitingService != null) {
            rateLimitingService.checkAuthIdentity("register", request.getEmail());
        }

        UserRequest userRequest = new UserRequest();
        userRequest.setFullName(request.getFullName());
        userRequest.setEmail(request.getEmail());
        userRequest.setPassword(request.getPassword());
        userRequest.setRole(Role.CLIENT);

        User created = userService.create(userRequest);
        created.setEmailVerified(false);
        created.setMarketingOptIn(request.isMarketingOptIn());
        userRepository.save(created);

        publisher.publishEvent(new com.agence.voyage.event.AccountRegisteredEvent(created.getId()));
        notifications.publish(new com.agence.voyage.event.UserRegisteredEvent("account:welcome:" + created.getId(), created.getId()));
        return toResponse(created);
    }

    @Transactional(noRollbackFor = {com.agence.voyage.exception.UnauthorizedException.class})
    public AuthResponse login(LoginRequest request) {
        String cleanEmail = request.getEmail() != null ? request.getEmail().trim() : "";
        if (rateLimitingService != null) {
            rateLimitingService.checkAuthIdentity("login", cleanEmail);
        }

        User user = userRepository.findByEmailIgnoreCase(cleanEmail).orElse(null);

        // Compte inexistant : message générique constant
        if (user == null) {
            if (auditService != null) {
                auditService.logAs(null, cleanEmail, "ANONYMOUS", AuditAction.LOGIN_FAILURE.name(), "AUTH", null,
                        "Identifiants invalides pour l'email: " + cleanEmail, null, "{\"email\":\"" + cleanEmail + "\"}");
            }
            throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIALS, "Identifiants invalides");
        }

        // Compte temporairement verrouillé : message générique identique
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
            if (auditService != null) {
                auditService.logAs(user.getId(), user.getEmail(), user.getRole().name(), AuditAction.LOGIN_FAILURE.name(), "AUTH", user.getId(),
                        "Tentative de connexion sur compte verrouillé jusqu'à " + user.getLockedUntil(), null, null);
            }
            throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIALS, "Identifiants invalides");
        }

        // Vérification mot de passe
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);
            if (attempts >= 5) {
                user.setLockedUntil(LocalDateTime.now().plusMinutes(15));
                log.warn("account_locked userId={} email={}", user.getId(), user.getEmail());
                if (auditService != null) {
                    auditService.logAs(user.getId(), user.getEmail(), user.getRole().name(), "ACCOUNT_LOCKED", "AUTH", user.getId(),
                            "Compte verrouillé pour 15 minutes suite à 5 échecs consécutifs", null, null);
                }
            }
            userRepository.save(user);

            if (auditService != null) {
                auditService.logAs(user.getId(), user.getEmail(), user.getRole().name(), AuditAction.LOGIN_FAILURE.name(), "AUTH", user.getId(),
                        "Échec de connexion (tentative " + attempts + ")", null, null);
            }
            throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIALS, "Identifiants invalides");
        }

        if (user.isArchived()) {
            if (auditService != null) {
                auditService.logAs(user.getId(), user.getEmail(), user.getRole().name(), AuditAction.LOGIN_FAILURE.name(), "AUTH", user.getId(),
                        "Tentative de connexion sur un compte désactivé", null, "{\"email\":\"" + user.getEmail() + "\"}");
            }
            throw new UnauthorizedException(ErrorCode.ACCOUNT_ARCHIVED, "Ce compte est désactivé");
        }

        if (properties.requireEmailVerification() && !user.isEmailVerified()) {
            if (auditService != null) {
                auditService.logAs(user.getId(), user.getEmail(), user.getRole().name(), AuditAction.LOGIN_FAILURE.name(), "AUTH", user.getId(),
                        "Tentative de connexion avec email non vérifié", null, "{\"email\":\"" + user.getEmail() + "\"}");
            }
            throw new UnauthorizedException(ErrorCode.EMAIL_NOT_VERIFIED, "Vérifiez votre adresse e-mail avant de vous connecter");
        }

        // Connexion réussie : réinitialisation des échecs et déverrouillage
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        if (auditService != null) {
            auditService.logAs(user.getId(), user.getEmail(), user.getRole().name(), AuditAction.LOGIN_SUCCESS.name(), "USER", user.getId(),
                    "Connexion réussie", null, "{\"email\":\"" + user.getEmail() + "\"}");
        }

        return toResponse(user);
    }

    @Transactional
    public void unlockUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : id=" + userId));
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        if (auditService != null) {
            auditService.log("ACCOUNT_UNLOCKED", "USER", userId, "Compte déverrouillé par l'administrateur", null, null);
        }
        log.info("account_unlocked userId={}", userId);
    }

    public AuthResponse toResponse(User user) {
        log.debug("authentication_success userId={} role={}", user.getId(), user.getRole());
        return new AuthResponse(jwtService.generateToken(user), UserResponse.from(user));
    }
}
