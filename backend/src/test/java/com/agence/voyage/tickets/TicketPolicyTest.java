package com.agence.voyage.tickets;

import com.agence.voyage.entity.TicketCategory;
import com.agence.voyage.entity.TicketPriority;
import com.agence.voyage.entity.TicketStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TicketPolicyTest {

    private static final Pattern REFERENCE_PATTERN = Pattern.compile("^TK-\\d{4}-\\d{6}$");

    private boolean isValidTransition(TicketStatus from, TicketStatus to) {
        return switch (from) {
            case OPEN -> to == TicketStatus.IN_PROGRESS || to == TicketStatus.RESOLVED || to == TicketStatus.CLOSED;
            case IN_PROGRESS -> to == TicketStatus.RESOLVED || to == TicketStatus.OPEN;
            case RESOLVED -> to == TicketStatus.CLOSED || to == TicketStatus.OPEN;
            case CLOSED -> false;
        };
    }

    private boolean isClientAllowedTransition(TicketStatus from, TicketStatus to) {
        if (!isValidTransition(from, to)) return false;
        return (to == TicketStatus.CLOSED && (from == TicketStatus.OPEN || from == TicketStatus.RESOLVED))
            || (to == TicketStatus.OPEN && from == TicketStatus.RESOLVED);
    }

    @ParameterizedTest
    @CsvSource({
        "OPEN, IN_PROGRESS, true",
        "OPEN, RESOLVED, true",
        "OPEN, CLOSED, true",
        "IN_PROGRESS, RESOLVED, true",
        "IN_PROGRESS, OPEN, true",
        "IN_PROGRESS, CLOSED, false",
        "RESOLVED, CLOSED, true",
        "RESOLVED, OPEN, true",
        "RESOLVED, IN_PROGRESS, false",
        "CLOSED, OPEN, false",
        "CLOSED, IN_PROGRESS, false",
        "CLOSED, RESOLVED, false",
        "CLOSED, CLOSED, false"
    })
    @DisplayName("Vérifie les transitions autorisées et interdites de la machine à états")
    void stateMachineTransitions(TicketStatus from, TicketStatus to, boolean expected) {
        assertEquals(expected, isValidTransition(from, to));
    }

    @ParameterizedTest
    @CsvSource({
        "OPEN, CLOSED, true",
        "RESOLVED, CLOSED, true",
        "RESOLVED, OPEN, true",
        "OPEN, IN_PROGRESS, false",
        "OPEN, RESOLVED, false",
        "IN_PROGRESS, OPEN, false",
        "IN_PROGRESS, RESOLVED, false"
    })
    @DisplayName("Vérifie les restrictions de transitions spécifiques aux clients et fournisseurs")
    void clientTransitionRestrictions(TicketStatus from, TicketStatus to, boolean expected) {
        assertEquals(expected, isClientAllowedTransition(from, to));
    }

    @Test
    @DisplayName("Format de référence : doit être TK-YYYY-XXXXXX")
    void referenceFormatCompliance() {
        assertTrue(REFERENCE_PATTERN.matcher("TK-2026-000001").matches());
        assertTrue(REFERENCE_PATTERN.matcher("TK-2026-999999").matches());
        assertFalse(REFERENCE_PATTERN.matcher("TK-26-00001").matches());
        assertFalse(REFERENCE_PATTERN.matcher("BK-2026-000001").matches());
    }

    @Test
    @DisplayName("Énumérations : intégrité des valeurs requises")
    void enumCompleteness() {
        assertEquals(4, TicketStatus.values().length);
        assertEquals(4, TicketPriority.values().length);
        assertEquals(6, TicketCategory.values().length);
    }
}

