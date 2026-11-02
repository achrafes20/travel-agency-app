package com.agence.voyage.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@ActiveProfiles("test")
class EndpointSecurityExhaustivenessTest {

    @Autowired
    @org.springframework.beans.factory.annotation.Qualifier("requestMappingHandlerMapping")
    private RequestMappingHandlerMapping handlerMapping;

    @Test
    void allDeclaredEndpointsAreMappedAndSecured() {
        assertNotNull(handlerMapping, "RequestMappingHandlerMapping doit être injecté");
        var handlerMethods = handlerMapping.getHandlerMethods();
        assertFalse(handlerMethods.isEmpty(), "Le contexte d'API Spring MVC doit comporter des endpoints déclarés");

        handlerMethods.forEach((info, method) -> {
            Set<String> patterns = info.getDirectPaths();
            if (patterns.isEmpty() && info.getPathPatternsCondition() != null) {
                patterns = info.getPathPatternsCondition().getPatternValues();
            }
            assertNotNull(patterns, "Le pattern d'URL ne doit pas être null");
            assertNotNull(method.getMethod(), "La méthode de contrôleur ne doit pas être null");
        });
    }
}
