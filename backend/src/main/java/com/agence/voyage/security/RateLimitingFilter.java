package com.agence.voyage.security;

import com.agence.voyage.dto.ApiError;
import com.agence.voyage.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Set;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final RateLimitingService rateLimitingService;
    private final ObjectMapper objectMapper;

    @Value("${app.security.rate-limit.trusted-proxies:}")
    private List<String> trustedProxies;

    private static final Set<String> AUTH_ENDPOINTS = Set.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/refresh",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/auth/verify-email",
            "/api/auth/resend-verification"
    );

    public RateLimitingFilter(RateLimitingService rateLimitingService, ObjectMapper objectMapper) {
        this.rateLimitingService = rateLimitingService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        String uri = request.getRequestURI();
        if (!uri.startsWith("/api/")) {
            chain.doFilter(request, response);
            return;
        }

        String clientIp = extractClientIp(request);

        RateLimitingService.RateLimitProbe probe;
        if (isAuthEndpoint(uri)) {
            probe = rateLimitingService.checkAuthIp(clientIp);
        } else {
            probe = rateLimitingService.checkGlobalApi(clientIp);
        }

        if (!probe.allowed()) {
            sendRateLimitResponse(response, request, probe.retryAfterSeconds());
            return;
        }

        chain.doFilter(request, response);
    }

    private boolean isAuthEndpoint(String uri) {
        for (String endpoint : AUTH_ENDPOINTS) {
            if (uri.equals(endpoint) || uri.startsWith(endpoint + "/")) {
                return true;
            }
        }
        return false;
    }

    private String extractClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        if (trustedProxies != null && !trustedProxies.isEmpty() && trustedProxies.contains(remoteAddr)) {
            String xf = request.getHeader("X-Forwarded-For");
            if (xf != null && !xf.isBlank()) {
                return xf.split(",")[0].trim();
            }
        }
        return remoteAddr != null ? remoteAddr : "127.0.0.1";
    }

    private void sendRateLimitResponse(HttpServletResponse response, HttpServletRequest request, long retryAfterSeconds)
            throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));

        ApiError error = new ApiError(
                Instant.now(),
                HttpStatus.TOO_MANY_REQUESTS.value(),
                ErrorCode.RATE_LIMIT_EXCEEDED.name(),
                "Trop de requêtes. Veuillez patienter " + retryAfterSeconds + " secondes avant de réessayer.",
                null,
                request.getRequestURI(),
                MDC.get("correlationId")
        );

        response.getWriter().write(objectMapper.writeValueAsString(error));
    }
}

