package com.agence.voyage.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.Locale;

public final class CityNormalizer {

    private CityNormalizer() {
    }

    /**
     * Normalise un nom de ville pour la comparaison et la recherche de doublons :
     * - trim et réduction des espaces successifs à un seul espace
     * - suppression des accents / signes diacritiques (Unicode NFD)
     * - conversion en minuscules
     */
    public static String normalizeForComparison(String name) {
        if (name == null) {
            return "";
        }
        String trimmed = name.trim()
                .replaceAll("\\s+", " ")
                .replaceAll("\\s*-\\s*", "-");
        if (trimmed.isEmpty()) {
            return "";
        }
        String decomposed = Normalizer.normalize(trimmed, Normalizer.Form.NFD);
        String withoutAccents = decomposed.replaceAll("\\p{M}", "");
        return withoutAccents.toLowerCase(Locale.ROOT);
    }

    /**
     * Normalise un nom de ville pour l'affichage :
     * - trim et réduction des espaces successifs
     * - première lettre de chaque mot en majuscule, reste en minuscules (gère tirets et apostrophes)
     */
    public static String normalizeForDisplay(String name) {
        if (name == null) {
            return "";
        }
        String trimmed = name.trim()
                .replaceAll("\\s+", " ")
                .replaceAll("\\s*-\\s*", "-");
        if (trimmed.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        boolean capitalizeNext = true;
        for (char c : trimmed.toCharArray()) {
            if (Character.isWhitespace(c) || c == '-' || c == '\'') {
                capitalizeNext = true;
                sb.append(c);
            } else if (capitalizeNext) {
                sb.append(Character.toUpperCase(c));
                capitalizeNext = false;
            } else {
                sb.append(Character.toLowerCase(c));
            }
        }
        return sb.toString();
    }

    /**
     * Arrondit une coordonnée GPS à 4 décimales (~11 mètres de précision).
     */
    public static Double roundCoordinate(Double coord) {
        if (coord == null) {
            return null;
        }
        return BigDecimal.valueOf(coord)
                .setScale(4, RoundingMode.HALF_UP)
                .doubleValue();
    }

    /**
     * Vérifie si deux coordonnées sont proches (tolérance par défaut ~0.02 degré / ~2 km).
     */
    public static boolean areCoordinatesClose(Double lat1, Double lon1, Double lat2, Double lon2, double tolerance) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
            return false;
        }
        return Math.abs(lat1 - lat2) <= tolerance && Math.abs(lon1 - lon2) <= tolerance;
    }
}
