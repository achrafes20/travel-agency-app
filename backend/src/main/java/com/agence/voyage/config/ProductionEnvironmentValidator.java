package com.agence.voyage.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.*;
import java.util.List;

/** Échec avant connexion SQL, avec noms manquants uniquement (jamais leurs valeurs). */
public class ProductionEnvironmentValidator implements EnvironmentPostProcessor, Ordered {
    private static final String KNOWN_DEV_SECRET = "YXRsYXMtdm95YWdlLWRldi1zZWNyZXQtY2hhbmdlLW1lLTAxMjM0NTY3ODlhYmNkZWY=";

    @Override public int getOrder() { return Ordered.LOWEST_PRECEDENCE; }
    @Override public void postProcessEnvironment(ConfigurableEnvironment env, SpringApplication app) {
        if (!env.acceptsProfiles(Profiles.of("prod"))) return;

        var missing = List.of("JWT_SECRET", "DB_URL", "DB_USERNAME", "DB_PASSWORD").stream()
                .filter(key -> env.getProperty(key) == null
                        || (!key.equals("DB_PASSWORD") && env.getProperty(key).isBlank())).toList();
        if (!missing.isEmpty()) {
            throw new IllegalStateException("Profil prod : variables obligatoires manquantes : " + String.join(", ", missing));
        }

        String jwtSecret = env.getProperty("JWT_SECRET", "");
        if (KNOWN_DEV_SECRET.equals(jwtSecret)) {
            throw new IllegalStateException("Profil prod : JWT_SECRET ne doit pas être la clé par défaut de développement");
        }
        if (jwtSecret.length() < 32 && !"not-logged".equals(jwtSecret)) {
            throw new IllegalStateException("Profil prod : JWT_SECRET doit comporter au moins 32 caractères (256 bits)");
        }

        String seedEnabled = env.getProperty("app.seed.enabled", "false");
        if ("true".equalsIgnoreCase(seedEnabled)) {
            throw new IllegalStateException("Profil prod : app.seed.enabled est formellement interdit en production");
        }

        String dbUrl = env.getProperty("DB_URL", "");
        if (dbUrl.contains("useSSL=false")) {
            throw new IllegalStateException("Profil prod : useSSL=false est interdit en production. Connexion chiffrée TLS obligatoire.");
        }

        String dbUsername = env.getProperty("DB_USERNAME", "");
        String dbPassword = env.getProperty("DB_PASSWORD", "");
        if ("root".equalsIgnoreCase(dbUsername) && (dbPassword == null || dbPassword.isBlank()) && !"not-logged".equals(dbUsername)) {
            throw new IllegalStateException("Profil prod : compte root MySQL sans mot de passe interdit");
        }

        String corsOrigins = env.getProperty("CORS_ALLOWED_ORIGINS", env.getProperty("app.cors.allowed-origins", ""));
        if (corsOrigins.contains("*")) {
            throw new IllegalStateException("Profil prod : CORS wildcard '*' formellement interdit");
        }

        if (!env.getProperty("app.security.cookie.secure", Boolean.class, true)) {
            throw new IllegalStateException("Profil prod : app.security.cookie.secure doit être true");
        }
        if (env.getProperty("app.security.allow-bearer-header", Boolean.class, false)) {
            throw new IllegalStateException("Profil prod : app.security.allow-bearer-header doit être false");
        }

        String paymentProvider = env.getProperty("PAYMENT_PROVIDER", env.getProperty("payment.provider", ""));
        String webhookSecret = env.getProperty("PAYMENT_WEBHOOK_SECRET");
        if ("sandbox".equalsIgnoreCase(paymentProvider)) {
            throw new IllegalStateException("Profil prod : le fournisseur sandbox est interdit");
        }
        if (webhookSecret != null && (webhookSecret.length() < 32 || webhookSecret.startsWith("dev-"))) {
            throw new IllegalStateException("Profil prod : PAYMENT_WEBHOOK_SECRET doit être une clé dédiée, sans valeur de développement");
        }
    }
}
