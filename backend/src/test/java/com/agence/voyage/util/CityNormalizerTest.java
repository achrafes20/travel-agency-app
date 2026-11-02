package com.agence.voyage.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CityNormalizerTest {

    @Test
    void normalizeForComparison_removesAccentsAndTrimsAndLowercases() {
        assertEquals("fes", CityNormalizer.normalizeForComparison("Fès"));
        assertEquals("marrakech", CityNormalizer.normalizeForComparison("  MARRAKECH   "));
        assertEquals("rabat-sale", CityNormalizer.normalizeForComparison("Rabat-Salé"));
        assertEquals("tanger-tetouan-al hoceima", CityNormalizer.normalizeForComparison("  Tanger - Tétouan - Al   Hoceïma  "));
        assertEquals("", CityNormalizer.normalizeForComparison(null));
        assertEquals("", CityNormalizer.normalizeForComparison("   "));
    }

    @Test
    void normalizeForDisplay_capitalizesProperly() {
        assertEquals("Casablanca", CityNormalizer.normalizeForDisplay("casablanca"));
        assertEquals("Rabat-Salé", CityNormalizer.normalizeForDisplay("rabat-salé"));
        assertEquals("", CityNormalizer.normalizeForDisplay(null));
    }

    @Test
    void roundCoordinate_roundsTo4Decimals() {
        assertEquals(31.6295, CityNormalizer.roundCoordinate(31.62948123));
        assertEquals(-7.9811, CityNormalizer.roundCoordinate(-7.98112));
        assertNull(CityNormalizer.roundCoordinate(null));
    }

    @Test
    void areCoordinatesClose_matchesNearbyCoordinates() {
        assertTrue(CityNormalizer.areCoordinatesClose(31.6295, -7.9811, 31.6290, -7.9815, 0.01));
        assertFalse(CityNormalizer.areCoordinatesClose(31.6295, -7.9811, 33.5731, -7.5898, 0.05));
    }
}

