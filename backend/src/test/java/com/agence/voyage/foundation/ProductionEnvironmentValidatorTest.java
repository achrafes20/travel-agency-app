package com.agence.voyage.foundation;

import com.agence.voyage.config.ProductionEnvironmentValidator;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import static org.junit.jupiter.api.Assertions.*;

class ProductionEnvironmentValidatorTest {
    @Test void productionFailsBeforeDatabaseAndNamesEveryMissingVariable() {
        var env = new MockEnvironment(); env.setActiveProfiles("prod");
        String message = assertThrows(IllegalStateException.class,
                () -> new ProductionEnvironmentValidator().postProcessEnvironment(env, null)).getMessage();
        for (String key : new String[]{"JWT_SECRET","DB_URL","DB_USERNAME","DB_PASSWORD"}) assertTrue(message.contains(key));
    }
    @Test void devNeedsNoProductionVariablesAndProdAcceptsSuppliedVariables() {
        var validator = new ProductionEnvironmentValidator();
        var dev = new MockEnvironment(); dev.setActiveProfiles("dev");
        assertDoesNotThrow(() -> validator.postProcessEnvironment(dev, null));
        var prod = new MockEnvironment().withProperty("JWT_SECRET", "not-logged").withProperty("DB_URL", "not-logged")
                .withProperty("DB_USERNAME", "not-logged").withProperty("DB_PASSWORD", "not-logged");
        prod.setActiveProfiles("prod");
        assertDoesNotThrow(() -> validator.postProcessEnvironment(prod, null));
        // Présence explicite distincte d'une variable manquante : compte local de test.
        prod.setProperty("DB_PASSWORD", "");
        assertDoesNotThrow(() -> validator.postProcessEnvironment(prod, null));
    }

    @Test void productionRejectsInsecureCookieAndBearerFallback() {
        var validator = new ProductionEnvironmentValidator();
        var insecureCookie = validProductionEnvironment()
                .withProperty("app.security.cookie.secure", "false");
        assertTrue(assertThrows(IllegalStateException.class,
                () -> validator.postProcessEnvironment(insecureCookie, null)).getMessage().contains("cookie.secure"));

        var bearerFallback = validProductionEnvironment()
                .withProperty("app.security.allow-bearer-header", "true");
        assertTrue(assertThrows(IllegalStateException.class,
                () -> validator.postProcessEnvironment(bearerFallback, null)).getMessage().contains("allow-bearer-header"));
    }

    private MockEnvironment validProductionEnvironment() {
        var env = new MockEnvironment().withProperty("JWT_SECRET", "not-logged")
                .withProperty("DB_URL", "not-logged")
                .withProperty("DB_USERNAME", "not-logged")
                .withProperty("DB_PASSWORD", "not-logged");
        env.setActiveProfiles("prod");
        return env;
    }
}

