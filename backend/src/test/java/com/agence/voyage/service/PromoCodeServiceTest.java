package com.agence.voyage.service;

import com.agence.voyage.dto.PromoCodeRequest;
import com.agence.voyage.entity.DiscountType;
import com.agence.voyage.entity.PromoCode;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.exception.ResourceNotFoundException;
import com.agence.voyage.repository.PromoCodeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
@ActiveProfiles("test")
@Import(PromoCodeService.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
class PromoCodeServiceTest {

    @Autowired
    private PromoCodeService promoCodeService;

    @Autowired
    private PromoCodeRepository promoCodeRepository;

    private PromoCodeRequest request(String code, DiscountType type, String value, LocalDate expiry) {
        PromoCodeRequest r = new PromoCodeRequest();
        r.setCode(code);
        r.setDiscountType(type);
        r.setValue(new BigDecimal(value));
        r.setExpiryDate(expiry);
        return r;
    }

    @Test
    void create_trimsAndUppercasesTheCode_andIsActiveByDefault() {
        PromoCode promo = promoCodeService.create(request("  ete25 ", DiscountType.PERCENTAGE, "25", null));

        assertEquals("ETE25", promo.getCode());
        assertTrue(promo.getActive());
        assertNull(promo.getExpiryDate());
    }

    @Test
    void create_rejectsDuplicateCodeIgnoringCase() {
        promoCodeService.create(request("ETE25", DiscountType.PERCENTAGE, "25", null));

        assertThrows(BusinessException.class,
                () -> promoCodeService.create(request("ete25", DiscountType.FIXED, "50", null)));
    }

    @Test
    void create_rejectsPercentageOver100_andPastExpiry() {
        assertThrows(BusinessException.class,
                () -> promoCodeService.create(request("TROP", DiscountType.PERCENTAGE, "101", null)));
        assertThrows(BusinessException.class,
                () -> promoCodeService.create(request("PASSE", DiscountType.FIXED, "50", LocalDate.now().minusDays(1))));
        // un montant fixe peut dépasser 100
        promoCodeService.create(request("GROS", DiscountType.FIXED, "500", LocalDate.now()));
    }

    @Test
    void update_keepsOwnCode_andAllowsDeactivatingAnExpiredCode() {
        PromoCode promo = promoCodeRepository.save(expired("VIEUX"));

        PromoCodeRequest r = request("vieux", DiscountType.PERCENTAGE, "10", promo.getExpiryDate());
        r.setActive(false);
        PromoCode updated = promoCodeService.update(promo.getId(), r);

        assertEquals("VIEUX", updated.getCode());
        assertFalse(updated.getActive());
        // en revanche, on ne peut pas choisir une nouvelle date passée
        r.setExpiryDate(LocalDate.now().minusDays(2));
        assertThrows(BusinessException.class, () -> promoCodeService.update(promo.getId(), r));
    }

    @Test
    void validate_acceptsActiveCodeIgnoringCase_andExpiryDayIsInclusive() {
        promoCodeService.create(request("DERNIER", DiscountType.FIXED, "30", LocalDate.now()));

        assertEquals("DERNIER", promoCodeService.validate(" dernier ").getCode());
    }

    @Test
    void validate_rejectsUnknownDisabledAndExpiredCodes() {
        PromoCode disabled = promoCodeService.create(request("OFF", DiscountType.FIXED, "30", null));
        disabled.setActive(false);
        promoCodeRepository.save(disabled);
        promoCodeRepository.save(expired("VIEUX"));

        assertEquals("Code promo invalide",
                assertThrows(BusinessException.class, () -> promoCodeService.validate("NOPE")).getMessage());
        assertEquals("Ce code promo est désactivé",
                assertThrows(BusinessException.class, () -> promoCodeService.validate("OFF")).getMessage());
        assertEquals("Ce code promo a expiré",
                assertThrows(BusinessException.class, () -> promoCodeService.validate("VIEUX")).getMessage());
        assertThrows(BusinessException.class, () -> promoCodeService.validate(null));
    }

    @Test
    void delete_removesTheCode_andUnknownIdIs404() {
        PromoCode promo = promoCodeService.create(request("BYE", DiscountType.FIXED, "30", null));

        promoCodeService.delete(promo.getId());

        assertFalse(promoCodeRepository.existsById(promo.getId()));
        assertThrows(ResourceNotFoundException.class, () -> promoCodeService.delete(promo.getId()));
    }

    private PromoCode expired(String code) {
        PromoCode promo = new PromoCode();
        promo.setCode(code);
        promo.setDiscountType(DiscountType.PERCENTAGE);
        promo.setValue(new BigDecimal("10"));
        promo.setExpiryDate(LocalDate.now().minusDays(3));
        promo.setActive(true);
        return promo;
    }
}
