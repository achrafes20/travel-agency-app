package com.agence.voyage.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtre d'authentification JWT :
 * 1. Vérifie en priorité le cookie HttpOnly « atlas_access_token »
 * 2. En repli (transition / tests / Postman), accepte « Authorization: Bearer ... » uniquement si autorisé par configuration.
 * Valide la signature, l'expiration et compare tokenVersion avec la base.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";
    public static final String AUTH_METHOD_ATTR = "atlas.auth.method";

    private final JwtService jwtService;
    private final AppUserDetailsService userDetailsService;
    private final CookieAuthHelper cookieAuthHelper;

    @Value("${app.security.allow-bearer-header:false}")
    private boolean allowBearerHeader;

    public JwtAuthenticationFilter(JwtService jwtService,
                                   AppUserDetailsService userDetailsService,
                                   CookieAuthHelper cookieAuthHelper) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.cookieAuthHelper = cookieAuthHelper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = cookieAuthHelper.extractAccessToken(request);
            String method = "COOKIE";

            if (token == null && allowBearerHeader) {
                String header = request.getHeader("Authorization");
                if (header != null && header.startsWith(BEARER_PREFIX)) {
                    token = header.substring(BEARER_PREFIX.length()).trim();
                    method = "BEARER";
                }
            }

            if (token != null && !token.isBlank()) {
                try {
                    var claims = jwtService.parseVerified(token);
                    authenticate(claims, request);
                    var authentication = SecurityContextHolder.getContext().getAuthentication();
                    if (authentication != null && authentication.getPrincipal() instanceof AppUserDetails user) {
                        request.setAttribute(AUTH_METHOD_ATTR, method);
                        org.slf4j.MDC.put("userId", String.valueOf(user.getId()));
                    }
                } catch (io.jsonwebtoken.ExpiredJwtException ex) {
                    request.setAttribute("authErrorCode", com.agence.voyage.exception.ErrorCode.TOKEN_EXPIRED);
                } catch (io.jsonwebtoken.JwtException | IllegalArgumentException ex) {
                    request.setAttribute("authErrorCode", com.agence.voyage.exception.ErrorCode.UNAUTHORIZED);
                }
            }
        }

        chain.doFilter(request, response);
    }

    private void authenticate(io.jsonwebtoken.Claims claims, HttpServletRequest request) {
        try {
            AppUserDetails user = (AppUserDetails) userDetailsService.loadUserByUsername(claims.getSubject());
            if (!user.isEnabled()) {
                request.setAttribute("authErrorCode", com.agence.voyage.exception.ErrorCode.ACCOUNT_ARCHIVED);
                return;
            }
            Number version = claims.get("tv", Number.class);
            Number id = claims.get("userId", Number.class);
            if (version == null || id == null || version.longValue() != user.getTokenVersion() || id.longValue() != user.getId()) {
                request.setAttribute("authErrorCode", com.agence.voyage.exception.ErrorCode.TOKEN_REVOKED);
                return;
            }
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
        } catch (UsernameNotFoundException ignored) {
            // Compte supprimé : la requête reste anonyme et sera rejetée en 401
        }
    }
}
