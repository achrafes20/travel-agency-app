package com.agence.voyage.service;

import com.agence.voyage.dto.PromoCodeRequest;
import com.agence.voyage.entity.AuditAction;
import com.agence.voyage.entity.Cart;
import com.agence.voyage.entity.DiscountType;
import com.agence.voyage.entity.PromoCode;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.exception.ResourceNotFoundException;
import com.agence.voyage.repository.BookingRepository;
import com.agence.voyage.repository.CartRepository;
import com.agence.voyage.repository.PromoCodeRepository;
import org.springframework.data.domain.Sort;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class PromoCodeService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(PromoCodeService.class);

    private static final BigDecimal MAX_PERCENTAGE = new BigDecimal("100");

    private final PromoCodeRepository promoCodeRepository;
    private final CartRepository cartRepository;
    private final BookingRepository bookingRepository;
    private final AuditService auditService;

    public PromoCodeService(PromoCodeRepository promoCodeRepository, CartRepository cartRepository,
                            BookingRepository bookingRepository, @Nullable AuditService auditService) {
        this.promoCodeRepository = promoCodeRepository;
        this.cartRepository = cartRepository;
        this.bookingRepository = bookingRepository;
        this.auditService = auditService;
    }

    public List<PromoCode> findAll() {
        log.debug("list resource=promocode");
        return promoCodeRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }

    public PromoCode findById(Long id) {
        return promoCodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Code promo introuvable : id=" + id));
    }

    @Transactional
    public PromoCode create(PromoCodeRequest request) {
        PromoCode promo = new PromoCode();
        apply(promo, request);
        if (promo.getExpiryDate() != null && promo.getExpiryDate().isBefore(LocalDate.now())) {
            throw new BusinessException("La date d'expiration ne peut pas être dans le passé");
        }
        PromoCode saved = promoCodeRepository.save(promo);

        if (auditService != null) {
            auditService.log(AuditAction.PROMO_CREATED.name(), "PROMO_CODE", saved.getId(),
                    "Création du code promo " + saved.getCode(), null, reducedPromo(saved));
        }

        return saved;
    }

    @Transactional
    public PromoCode update(Long id, PromoCodeRequest request) {
        PromoCode promo = findById(id);
        Map<String, Object> before = reducedPromo(promo);

        LocalDate previousExpiry = promo.getExpiryDate();
        apply(promo, request);
        // un code déjà expir reste modifiable (dsactivation) tant que sa date ne change pas
        boolean expiryChanged = promo.getExpiryDate() != null && !promo.getExpiryDate().equals(previousExpiry);
        if (expiryChanged && promo.getExpiryDate().isBefore(LocalDate.now())) {
            throw new BusinessException("La date d'expiration ne peut pas être dans le passé");
        }
        PromoCode saved = promoCodeRepository.save(promo);

        if (auditService != null) {
            auditService.log(AuditAction.PROMO_UPDATED.name(), "PROMO_CODE", saved.getId(),
                    "Mise  jour du code promo " + saved.getCode(), before, reducedPromo(saved));
        }

        return saved;
    }

    @Transactional
    public void delete(Long id) {
        PromoCode promo = findById(id);
        if (bookingRepository.existsByPromoCodeId(id)) {
            throw new BusinessException("Impossible de supprimer ce code : il a ǸtǸ utilisǸ dans des rǸservations (dǸsactivez-le  la place)");
        }
        Map<String, Object> before = reducedPromo(promo);

        // les paniers en cours perdent simplement leur code
        for (Cart cart : cartRepository.findByPromoCodeId(id)) {
            cart.setPromoCode(null);
        }
        cartRepository.flush();
        promoCodeRepository.delete(promo);

        if (auditService != null) {
            auditService.log(AuditAction.PROMO_DELETED.name(), "PROMO_CODE", id,
                    "Suppression du code promo " + promo.getCode(), before, null);
        }
    }

    /** Retrouve un code applicable  un panier ; {@link BusinessException} (400) s'il est inconnu, dsactiv ou expir. */
    public PromoCode validate(String code) {
        String normalized = code == null ? "" : code.trim();
        PromoCode promo = promoCodeRepository.findByCodeIgnoreCase(normalized)
                .orElseThrow(() -> new BusinessException(com.agence.voyage.exception.ErrorCode.PROMO_INVALID, "Code promo invalide"));
        String reason = unusableReason(promo);
        if (reason != null) {
            throw new BusinessException(promo.getExpiryDate() != null && promo.getExpiryDate().isBefore(LocalDate.now())
                    ? com.agence.voyage.exception.ErrorCode.PROMO_EXPIRED
                    : com.agence.voyage.exception.ErrorCode.PROMO_INVALID, reason);
        }
        return promo;
    }

    /** Motif pour lequel le code ne peut plus s'appliquer, ou {@code null} s'il est utilisable (valable jusqu'au jour d'expiration inclus). */
    public static String unusableReason(PromoCode promo) {
        if (!Boolean.TRUE.equals(promo.getActive())) {
            return "Ce code promo est désactivé";
        }
        if (promo.getExpiryDate() != null && promo.getExpiryDate().isBefore(LocalDate.now())) {
            return "Ce code promo a expiré";
        }
        return null;
    }

    private void apply(PromoCode promo, PromoCodeRequest r) {
        String code = r.getCode().trim().toUpperCase(Locale.ROOT);
        promoCodeRepository.findByCodeIgnoreCase(code)
                .filter(existing -> !existing.getId().equals(promo.getId()))
                .ifPresent(existing -> {
                    throw new BusinessException(com.agence.voyage.exception.ErrorCode.DUPLICATE_RESOURCE, "Ce code promo existe déjà : " + code);
                });
        if (r.getDiscountType() == DiscountType.PERCENTAGE && r.getValue().compareTo(MAX_PERCENTAGE) > 0) {
            throw new BusinessException("Une rǸduction en pourcentage ne peut pas dǸpasser 100 %");
        }
        promo.setCode(code);
        promo.setDiscountType(r.getDiscountType());
        promo.setValue(r.getValue());
        promo.setExpiryDate(r.getExpiryDate());
        promo.setActive(r.getActive() == null || r.getActive());
    }

    private Map<String, Object> reducedPromo(PromoCode p) {
        if (p == null) return null;
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", p.getId());
        map.put("code", p.getCode());
        map.put("discountType", p.getDiscountType() != null ? p.getDiscountType().name() : null);
        map.put("value", p.getValue());
        map.put("expiryDate", p.getExpiryDate());
        map.put("active", Boolean.TRUE.equals(p.getActive()));
        return map;
    }
}
