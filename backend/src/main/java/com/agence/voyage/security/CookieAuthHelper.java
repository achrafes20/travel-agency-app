package com.agence.voyage.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class CookieAuthHelper {

    public static final String ACCESS_COOKIE_NAME = "atlas_access_token";
    public static final String REFRESH_COOKIE_NAME = "atlas_refresh_token";

    @Value("${app.security.cookie.secure:false}")
    private boolean secure;

    @Value("${app.security.cookie.same-site:Lax}")
    private String sameSite;

    @Value("${app.jwt.access-ttl-seconds:900}")
    private long accessTtlSeconds;

    @Value("${app.jwt.refresh-ttl-days:7}")
    private long refreshTtlDays;

    public void setAuthCookies(HttpServletResponse response, String accessToken, String refreshTokenRaw, boolean rememberMe) {
        if (accessToken != null) {
            ResponseCookie accessCookie = ResponseCookie.from(ACCESS_COOKIE_NAME, accessToken)
                    .httpOnly(true)
                    .secure(secure)
                    .path("/")
                    .sameSite(sameSite)
                    .maxAge(Duration.ofSeconds(accessTtlSeconds))
                    .build();
            response.addHeader("Set-Cookie", accessCookie.toString());
        }

        if (refreshTokenRaw != null) {
            ResponseCookie.ResponseCookieBuilder refreshBuilder = ResponseCookie.from(REFRESH_COOKIE_NAME, refreshTokenRaw)
                    .httpOnly(true)
                    .secure(secure)
                    .path("/api/auth")
                    .sameSite(sameSite);

            if (rememberMe) {
                refreshBuilder.maxAge(Duration.ofDays(refreshTtlDays));
            } else {
                refreshBuilder.maxAge(-1); // Session cookie (fermeture onglet/navigateur)
            }
            response.addHeader("Set-Cookie", refreshBuilder.build().toString());
        }
    }

    public void clearAuthCookies(HttpServletResponse response) {
        ResponseCookie clearAccess = ResponseCookie.from(ACCESS_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .sameSite(sameSite)
                .maxAge(0)
                .build();
        response.addHeader("Set-Cookie", clearAccess.toString());

        ResponseCookie clearRefresh = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secure)
                .path("/api/auth")
                .sameSite(sameSite)
                .maxAge(0)
                .build();
        response.addHeader("Set-Cookie", clearRefresh.toString());
    }

    public String extractAccessToken(HttpServletRequest request) {
        return extractCookieValue(request, ACCESS_COOKIE_NAME);
    }

    public String extractRefreshToken(HttpServletRequest request) {
        return extractCookieValue(request, REFRESH_COOKIE_NAME);
    }

    private String extractCookieValue(HttpServletRequest request, String name) {
        if (request == null || request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (name.equals(cookie.getName())) {
                String val = cookie.getValue();
                return (val != null && !val.isBlank()) ? val : null;
            }
        }
        return null;
    }
}

