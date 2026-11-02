package com.agence.voyage.foundation;

import com.agence.voyage.config.AppProperties;
import com.agence.voyage.dto.*;
import com.agence.voyage.exception.*;
import com.fasterxml.jackson.databind.*;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.ConstraintViolationException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.*;
import org.springframework.web.bind.annotation.*;
import org.slf4j.MDC;
import java.time.Instant;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(ErrorContractTest.Probe.class)
class ErrorContractTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired AppProperties properties;

    void assertError(RequestBuilder request, int status, String code) throws Exception {
        var result = mvc.perform(request).andReturn();
        assertEquals(status, result.getResponse().getStatus(), result.getResponse().getContentAsString());
        JsonNode body = mapper.readTree(result.getResponse().getContentAsString());
        Set<String> fields = new HashSet<>(); body.fieldNames().forEachRemaining(fields::add);
        assertEquals(Set.of("timestamp","status","code","message","details","path","correlationId"), fields);
        assertDoesNotThrow(() -> Instant.parse(body.get("timestamp").asText()));
        assertEquals(status, body.get("status").asInt());
        assertEquals(code, body.get("code").asText());
        assertFalse(body.get("message").asText().isBlank());
        assertEquals(result.getResponse().getHeader("X-Correlation-Id"), body.get("correlationId").asText());
        assertTrue(body.get("path").asText().startsWith("/"));
        assertFalse(body.toString().contains("internal-secret-probe"));
        assertNull(MDC.get("correlationId"));
        assertNull(MDC.get("userId"));
    }
    @Test void security401And403() throws Exception {
        assertError(get("/api/auth/me"), 401, "UNAUTHORIZED");
        var roleUser = org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("test").roles("CLIENT");
        assertError(get("/api/users").with(roleUser), 403, "FORBIDDEN");
    }
    @Test void invalidCredentials() throws Exception {
        assertError(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"missing@example.com\",\"password\":\"password123\"}"), 401, "INVALID_CREDENTIALS");
    }
    @Test void tokenExpired() throws Exception {
        String token = Jwts.builder().subject("test@example.com").expiration(Date.from(Instant.now().minusSeconds(60)))
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(properties.jwt().secret()))).compact();
        assertError(get("/api/auth/me").header("Authorization", "Bearer " + token), 401, "TOKEN_EXPIRED");
    }
    @Test void validationDetails() throws Exception {
        var result = mvc.perform(post("/api/offers/_probe/validate").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("supplier").roles("SUPPLIER")).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"\"}")).andReturn();
        assertEquals(400, result.getResponse().getStatus());
        JsonNode body = mapper.readTree(result.getResponse().getContentAsString());
        assertEquals("name", body.at("/details/0/field").asText());
        assertFalse(body.at("/details/0/message").asText().isBlank());
        assertError(post("/api/offers/_probe/validate").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("supplier").roles("SUPPLIER")).contentType(MediaType.APPLICATION_JSON).content("{}"),
                400, "VALIDATION_ERROR");
    }
    @Test void malformedAndTypeAndMissingParameter() throws Exception {
        assertError(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{"), 400, "BAD_REQUEST");
        assertError(get("/api/offers?type=INVALID"), 400, "BAD_REQUEST");
        assertError(get("/api/offers/_probe/parameter"), 400, "BAD_REQUEST");
    }
    @Test void constraintsConflictAnd500() throws Exception {
        assertError(get("/api/offers/_probe/constraint"), 400, "VALIDATION_ERROR");
        assertError(get("/api/offers/_probe/conflict"), 409, "CONFLICT");
        assertError(get("/api/offers/_probe/internal"), 500, "INTERNAL_ERROR");
    }
    @Test void adviceSecurityAndBusinessErrors() throws Exception {
        assertError(get("/api/offers/_probe/forbidden"), 403, "FORBIDDEN");
        assertError(get("/api/offers/_probe/auth"), 401, "UNAUTHORIZED");
        assertError(get("/api/offers/_probe/business"), 400, "CAPACITY_EXCEEDED");
    }
    @Test void missingRouteAndMissingResource() throws Exception {
        assertError(get("/api/offers/_no_route/a/b"), 404, "NOT_FOUND");
        assertError(get("/api/offers/99999999"), 404, "NOT_FOUND");
    }
    @Test void correlationReuseAndValidation() throws Exception {
        assertError(get("/api/offers/99999999").header("X-Correlation-Id", "test-123"), 404, "NOT_FOUND");
        var valid = mvc.perform(get("/api/status").header("X-Correlation-Id", "test-123")).andReturn();
        assertEquals("test-123", valid.getResponse().getHeader("X-Correlation-Id"));
        for (String id : List.of("bad_id", "x".repeat(65))) {
            var result = mvc.perform(get("/api/status").header("X-Correlation-Id", id)).andReturn();
            assertDoesNotThrow(() -> UUID.fromString(result.getResponse().getHeader("X-Correlation-Id")));
        }
    }
    @Test void corsErrorsUseTheSameContractAndCorrelationHeaderIsAllowed() throws Exception {
        assertError(get("/api/status").header("Origin", "https://not-allowed.example"), 403, "FORBIDDEN");
        var preflight = mvc.perform(options("/api/offers")
                .header("Origin", "http://localhost:5500")
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "X-Correlation-Id")).andReturn();
        assertEquals(200, preflight.getResponse().getStatus());
        assertEquals("http://localhost:5500", preflight.getResponse().getHeader("Access-Control-Allow-Origin"));
    }

    @RestController
    @RequestMapping("/api/offers/_probe")
    static class Probe {
        record Input(@NotBlank String name) {}
        @PostMapping("/validate") Input validate(@Valid @RequestBody Input input) { return input; }
        @GetMapping("/parameter") String parameter(@RequestParam String required) { return required; }
        @GetMapping("/{kind}") void error(@PathVariable String kind) {
            switch (kind) {
                case "constraint" -> throw new ConstraintViolationException(Set.of());
                case "conflict" -> throw new DataIntegrityViolationException("internal-secret-probe");
                case "internal" -> throw new IllegalStateException("internal-secret-probe");
                case "forbidden" -> throw new AccessDeniedException("internal-secret-probe");
                case "auth" -> throw new BadCredentialsException("internal-secret-probe");
                default -> throw new BusinessException(ErrorCode.CAPACITY_EXCEEDED, "Capacité insuffisante");
            }
        }
    }
}
