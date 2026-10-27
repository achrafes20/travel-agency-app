package com.agence.voyage.persistence;

import com.agence.voyage.entity.DiscountType;
import com.agence.voyage.entity.PromoCode;
import com.agence.voyage.repository.PromoCodeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class SchemaCreationTest {

    private static final Set<String> EXPECTED_TABLES = Set.of(
            "BOOKINGS",
            "BUNDLE_OFFERS",
            "BUNDLES",
            "CART_ITEMS",
            "CARTS",
            "CITIES",
            "NOTIFICATIONS",
            "OFFERS",
            "OFFER_IMAGES",
            "PAYMENTS",
            "PROMO_CODES",
            "USERS");

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PromoCodeRepository promoCodeRepository;

    @Test
    void hibernateCreatesEveryApplicationTable() {
        Set<String> actualTables = Set.copyOf(jdbcTemplate.queryForList(
                "select upper(table_name) from information_schema.tables where upper(table_schema) = 'PUBLIC'",
                String.class));

        assertTrue(actualTables.containsAll(EXPECTED_TABLES),
                () -> "Tables manquantes : " + EXPECTED_TABLES.stream()
                        .filter(table -> !actualTables.contains(table))
                        .toList());
    }

    @Test
    void promoCodeUsesAValidDiscountValueColumnAndCanBePersisted() {
        PromoCode promoCode = new PromoCode();
        promoCode.setCode("ATLAS10");
        promoCode.setDiscountType(DiscountType.PERCENTAGE);
        promoCode.setValue(new BigDecimal("10.00"));
        promoCode.setExpiryDate(LocalDate.now().plusMonths(1));

        PromoCode saved = promoCodeRepository.saveAndFlush(promoCode);

        assertTrue(saved.getId() != null);
        assertEquals(new BigDecimal("10.00"), saved.getValue());
        Integer columnCount = jdbcTemplate.queryForObject(
                "select count(*) from information_schema.columns "
                        + "where upper(table_schema) = 'PUBLIC' "
                        + "and upper(table_name) = 'PROMO_CODES' "
                        + "and upper(column_name) = 'DISCOUNT_VALUE'",
                Integer.class);
        assertEquals(1, columnCount);
    }
}
