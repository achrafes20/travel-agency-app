package com.agence.voyage.service;

import com.agence.voyage.dto.PromoCodeRequest;
import com.agence.voyage.entity.Cart;
import com.agence.voyage.entity.DiscountType;
import com.agence.voyage.entity.PromoCode;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.exception.ResourceNotFoundException;
import com.agence.voyage.repository.BookingRepository;
import com.agence.voyage.repository.CartRepository;
import com.agence.voyage.repository.PromoCodeRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
public class PromoCodeService {

    private static final BigDecimal MAX_PERCENTAGE = new BigDecimal("100");

    private final PromoCodeRepository promoCodeRepository;
    private final CartRepository cartRepository;
    private final BookingRepository bookingRepository;

    public PromoCodeService(PromoCodeRepository promoCodeRepository, CartRepository cartRepository,
                            BookingRepository bookingRepository) {
        this.promoCodeRepository = promoCodeRepository;
        this.cartRepository = cartRepository;
        this.bookingRepository = bookingRepository;
    }

    public List<PromoCode> findAll() {
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
        return promoCodeRepository.save(promo);
    }

    @Transactional
    public PromoCode update(Long id, PromoCodeRequest request) {
        PromoCode promo = findById(id);
        LocalDate previousExpiry = promo.getExpiryDate();
        apply(promo, request);
        // un code déjà expiré reste modifiable (désactivation) tant que sa date ne change pas
        boolean expiryChanged = promo.getExpiryDate() != null && !promo.getExpiryDate().equals(previousExpiry);
        if (expiryChanged && promo.getExpiryDate().isBefore(LocalDate.now())) {
            throw new BusinessException("La date d'expiration ne peut pas être dans le passé");
        }
        return promoCodeRepository.save(promo);
    }

    @Transactional
    public void delete(Long id) {
        PromoCode promo = findById(id);
        if (bookingRepository.existsByPromoCodeId(id)) {
            throw new BusinessException("Impossible de supprimer ce code : il a été utilisé dans des réservations (désactivez-le à la place)");
        }
        // les paniers en cours perdent simplement leur code
        for (Cart cart : cartRepository.findByPromoCodeId(id)) {
            cart.setPromoCode(null);
        }
        cartRepository.flush();
        promoCodeRepository.delete(promo);
    }

    /** Retrouve un code applicable à un panier ; {@link BusinessException} (400) s'il est inconnu, désactivé ou expiré. */
    public PromoCode validate(String code) {
        String normalized = code == null ? "" : code.trim();
        PromoCode promo = promoCodeRepository.findByCodeIgnoreCase(normalized)
                .orElseThrow(() -> new BusinessException("Code promo invalide"));
        String reason = unusableReason(promo);
        if (reason != null) {
            throw new BusinessException(reason);
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
                    throw new BusinessException("Ce code promo existe déjà : " + code);
                });
        if (r.getDiscountType() == DiscountType.PERCENTAGE && r.getValue().compareTo(MAX_PERCENTAGE) > 0) {
            throw new BusinessException("Une réduction en pourcentage ne peut pas dépasser 100 %");
        }
        promo.setCode(code);
        promo.setDiscountType(r.getDiscountType());
        promo.setValue(r.getValue());
        promo.setExpiryDate(r.getExpiryDate());
        promo.setActive(r.getActive() == null || r.getActive());
    }
}
