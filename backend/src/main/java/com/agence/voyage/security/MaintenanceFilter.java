package com.agence.voyage.security;

import com.agence.voyage.entity.SettingKeys;
import com.agence.voyage.service.SettingService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class MaintenanceFilter extends OncePerRequestFilter {

    private final SettingService settingService;

    public MaintenanceFilter(SettingService settingService) {
        this.settingService = settingService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Si le mode maintenance est dsactiv, on continue normalement
        if (!settingService.getBoolean(SettingKeys.MAINTENANCE_ENABLED)) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();

        // 1. Routes toujours autorises mme en maintenance
        if (request.getMethod().equalsIgnoreCase("OPTIONS")
                || path.equals("/error")
                || path.equals("/api/status")
                || path.startsWith("/api/auth/")
                || path.equals("/api/settings/public")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/v3/api-docs")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Les administrateurs conservent l'accs  l'ensemble des routes
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Toutes les autres requtes renvoient HTTP 503
        String message = settingService.getString(SettingKeys.MAINTENANCE_MESSAGE);
        if (message == null || message.isBlank()) {
            message = "Atlas Voyage est actuellement en maintenance. Nous serons de retour trs bientt.";
        }

        response.setStatus(HttpStatus.SERVICE_UNAVAILABLE.value());
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(String.format(
                "{\"status\":503,\"code\":\"MAINTENANCE_MODE\",\"error\":\"MAINTENANCE_MODE\",\"message\":\"%s\"}",
                escapeJson(message)
        ));
        response.getWriter().flush();
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
