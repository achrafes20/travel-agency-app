package com.agence.voyage.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Force le chargement du CsrfToken pour que le CookieCsrfTokenRepository écrive le cookie XSRF-TOKEN
 * dans la réponse HTTP pour les applications SPA (double-submit cookie).
 */
@Component
public class CsrfCookieFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (csrfToken != null) {
            // L'accès au jeton force son initialisation et le dépôt du cookie XSRF-TOKEN
            csrfToken.getToken();
        }
        filterChain.doFilter(request, response);
    }
}

