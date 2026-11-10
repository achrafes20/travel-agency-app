package com.agence.voyage.security;

import com.agence.voyage.exception.PasswordPolicyException;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Politique de sécurité des mots de passe appliquée à toutes les écritures (inscription, création, modification, reset).
 * Jamais appliquée à la connexion.
 */
@Component
public class PasswordPolicy {

    /** Longueur minimale unique, appliquée partout (inscription, modification, reset, validation de formulaire). */
    public static final int MIN_LENGTH = 12;
    public static final int MAX_LENGTH = 128;

    private static final Set<String> COMMON_PASSWORDS = new HashSet<>();

    static {
        // Chargement de la liste noire des mots de passe triviaux
        COMMON_PASSWORDS.addAll(Set.of("password123", "12345678", "azerty", "qwerty", "password",
                "1234567890", "azerty12345", "qwerty12345", "azerty123", "admin123", "maroc2026", "atlas2026"));
        try (InputStream is = PasswordPolicy.class.getResourceAsStream("/common-passwords.txt")) {
            if (is != null) {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        String trimmed = line.trim().toLowerCase(Locale.ROOT);
                        if (!trimmed.isEmpty() && !trimmed.startsWith("#")) {
                            COMMON_PASSWORDS.add(trimmed);
                        }
                    }
                }
            }
        } catch (Exception ignored) {
            // Repli sur la liste par défaut en cas d'erreur de lecture ressource
        }
    }

    public static List<String> violations(String password, String email) {
        return violations(password, email, null, MIN_LENGTH, MAX_LENGTH);
    }

    public static List<String> violations(String password, String email, String fullName, int minLength, int maxLength) {
        String value = password == null ? "" : password;
        List<String> rules = new ArrayList<>();

        int codePoints = value.codePointCount(0, value.length());
        if (codePoints < minLength) {
            rules.add("Au moins " + minLength + " caractères");
        }
        if (codePoints > maxLength || value.getBytes(StandardCharsets.UTF_8).length > 72) {
            rules.add("Au maximum 72 octets UTF-8");
        }

        if (value.codePoints().noneMatch(Character::isLowerCase)) {
            rules.add("Au moins une minuscule");
        }
        if (value.codePoints().noneMatch(Character::isUpperCase)) {
            rules.add("Au moins une majuscule");
        }
        if (value.codePoints().noneMatch(Character::isDigit)) {
            rules.add("Au moins un chiffre");
        }
        if (value.codePoints().noneMatch(c -> !Character.isLetterOrDigit(c) && !Character.isWhitespace(c) && !Character.isISOControl(c))) {
            rules.add("Au moins un caractère spécial");
        }

        String lower = value.toLowerCase(Locale.ROOT);

        // Vérification adresse email
        String account = email == null ? "" : email.strip().toLowerCase(Locale.ROOT);
        String local = account.contains("@") ? account.substring(0, account.indexOf('@')) : account;
        if (!local.isEmpty() && (lower.contains(local) || lower.contains(account))) {
            rules.add("Ne contient ni l'adresse e-mail ni sa partie avant @");
        }

        // Vérification nom complet
        if (fullName != null && !fullName.isBlank()) {
            String cleanName = fullName.strip().toLowerCase(Locale.ROOT);
            if (cleanName.length() >= 3 && lower.contains(cleanName)) {
                rules.add("Ne contient pas votre nom complet");
            }
        }

        // Mots de passe triviaux / dictionnaire
        if (COMMON_PASSWORDS.contains(lower)) {
            rules.add("Un mot de passe trivial est interdit");
        }

        if (value.codePoints().anyMatch(Character::isISOControl)) {
            rules.add("Aucun caractère de contrôle");
        }

        return List.copyOf(rules);
    }

    public static void require(String password, String email) {
        require(password, email, null);
    }

    public static void require(String password, String email, String fullName) {
        var errors = violations(password, email, fullName, MIN_LENGTH, MAX_LENGTH);
        if (!errors.isEmpty()) {
            throw new PasswordPolicyException(errors);
        }
    }
}
