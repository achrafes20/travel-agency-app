package com.agence.voyage.service;

import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.TicketStatus;
import com.agence.voyage.entity.User;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.exception.ErrorCode;
import com.agence.voyage.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;

@Service
public class GdprService {

    private static final Logger log = LoggerFactory.getLogger(GdprService.class);

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final FavoriteRepository favoriteRepository;
    private final TicketRepository ticketRepository;
    private final CartRepository cartRepository;
    private final OfferRepository offerRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public GdprService(UserRepository userRepository,
                       BookingRepository bookingRepository,
                       PaymentRepository paymentRepository,
                       FavoriteRepository favoriteRepository,
                       TicketRepository ticketRepository,
                       CartRepository cartRepository,
                       OfferRepository offerRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       AuditService auditService) {
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.favoriteRepository = favoriteRepository;
        this.ticketRepository = ticketRepository;
        this.cartRepository = cartRepository;
        this.offerRepository = offerRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> exportUserData(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Utilisateur introuvable"));

        Map<String, Object> export = new LinkedHashMap<>();

        // 1. Profil personnel (sans hashs, secrets ou tokens)
        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("id", user.getId());
        profile.put("fullName", user.getFullName());
        profile.put("email", user.getEmail());
        profile.put("role", user.getRole().name());
        profile.put("phone", user.getPhone());
        profile.put("country", user.getCountry());
        profile.put("createdAt", user.getCreatedAt());
        profile.put("marketingOptIn", user.isMarketingOptIn());
        export.put("profile", profile);

        // 2. Favoris
        List<Map<String, Object>> favorites = favoriteRepository.findByClient(user).stream()
                .map(f -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("favoriteId", f.getId());
                    m.put("offerId", f.getOffer() != null ? f.getOffer().getId() : null);
                    m.put("offerTitle", f.getOffer() != null ? f.getOffer().getTitle() : null);
                    m.put("createdAt", f.getCreatedAt());
                    return m;
                }).toList();
        export.put("favorites", favorites);

        // 3. Réservations
        List<Map<String, Object>> bookings = bookingRepository.findAll((root, query, cb) ->
                cb.equal(root.get("client").get("id"), userId), Pageable.unpaged())
                .getContent().stream()
                .map(b -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", b.getId());
                    m.put("reference", b.getReference());
                    m.put("status", b.getStatus() != null ? b.getStatus().name() : null);
                    m.put("total", b.getTotal());
                    m.put("createdAt", b.getCreatedAt());
                    return m;
                }).toList();
        export.put("bookings", bookings);

        // 4. Paiements
        List<Map<String, Object>> payments = paymentRepository.findAll((root, query, cb) ->
                cb.equal(root.get("client").get("id"), userId), Pageable.unpaged())
                .getContent().stream()
                .map(p -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", p.getId());
                    m.put("reference", p.getProviderReference());
                    m.put("amount", p.getAmount());
                    m.put("method", p.getMethod() != null ? p.getMethod().name() : null);
                    m.put("status", p.getStatus() != null ? p.getStatus().name() : null);
                    m.put("createdAt", p.getCreatedAt());
                    return m;
                }).toList();
        export.put("payments", payments);

        // 5. Tickets de support
        List<Map<String, Object>> tickets = ticketRepository.findAll((root, query, cb) ->
                cb.equal(root.get("requester").get("id"), userId), Pageable.unpaged())
                .getContent().stream()
                .map(t -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", t.getId());
                    m.put("reference", t.getReference());
                    m.put("subject", t.getSubject());
                    m.put("status", t.getStatus() != null ? t.getStatus().name() : null);
                    m.put("priority", t.getPriority() != null ? t.getPriority().name() : null);
                    m.put("createdAt", t.getCreatedAt());
                    return m;
                }).toList();
        export.put("tickets", tickets);

        return export;
    }

    @Transactional
    public void anonymizeUser(Long userId, String password) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Utilisateur introuvable"));

        if (user.isArchived()) {
            throw new BusinessException(ErrorCode.ACCOUNT_ARCHIVED, "Ce compte est déjà archivé ou supprimé");
        }

        if (password == null || !passwordEncoder.matches(password, user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_CURRENT_PASSWORD, "Le mot de passe actuel est incorrect");
        }

        // Empêcher la suppression du dernier administrateur actif
        if (user.getRole() == Role.ADMIN) {
            long activeAdmins = userRepository.findByRoleAndArchivedFalse(Role.ADMIN).size();
            if (activeAdmins <= 1) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "Impossible de supprimer le dernier compte administrateur actif");
            }
        }

        // 1. Anonymisation des données personnelles de l'utilisateur
        String pseudonym = "deleted-" + UUID.randomUUID() + "@anonymized.atlasvoyage.ma";
        user.setFullName("Utilisateur supprimé");
        user.setEmail(pseudonym);
        user.setPhone(null);
        user.setAvatarUrl(null);
        user.setCountry(null);
        user.setArchived(true);
        user.setTokenVersion(user.getTokenVersion() + 1);
        user.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));

        // 2. Révocation de toutes les sessions actives et refresh tokens
        refreshTokenRepository.deleteByUserId(userId);

        // 3. Suppression des favoris et panier actif
        favoriteRepository.deleteByClient(user);
        cartRepository.findByClientId(userId).ifPresent(cartRepository::delete);

        // 4. Si fournisseur : désactivation de ses offres
        if (user.getRole() == Role.SUPPLIER) {
            offerRepository.findBySupplierId(userId).forEach(offer -> offer.setActive(false));
        }

        // 5. Clôture des tickets ouverts
        ticketRepository.findAll((root, query, cb) -> cb.equal(root.get("requester").get("id"), userId), Pageable.unpaged())
                .getContent().forEach(ticket -> {
                    if (ticket.getStatus() != TicketStatus.CLOSED) {
                        ticket.setStatus(TicketStatus.CLOSED);
                    }
                });

        userRepository.save(user);

        // 6. Audit RGPD
        auditService.log("USER_GDPR_DELETED", "USER", user.getId(),
                "Suppression et anonymisation irréversible du compte utilisateur (RGPD / CNDP Loi 09-08)", null, null);

        log.info("gdpr_user_anonymized id={}", userId);
    }

    /**
     * Purge automatique planifiée chaque nuit à 03:00 pour les comptes archivés depuis plus de 36 mois.
     */
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void purgeArchivedAccountsOlderThanRetention() {
        LocalDateTime retentionLimit = LocalDateTime.now(ZoneOffset.UTC).minusMonths(36);
        List<User> oldAccounts = userRepository.findAll().stream()
                .filter(u -> u.isArchived() && u.getUpdatedAt() != null && u.getUpdatedAt().isBefore(retentionLimit))
                .toList();

        for (User u : oldAccounts) {
            refreshTokenRepository.deleteByUserId(u.getId());
            favoriteRepository.deleteByClient(u);
            cartRepository.findByClientId(u.getId()).ifPresent(cartRepository::delete);
            log.info("gdpr_retention_purge userId={}", u.getId());
        }
    }
}
