package com.agence.voyage.config;

import com.agence.voyage.security.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final AppProperties properties;
    private final org.springframework.core.env.Environment environment;

    @Value("${app.security.allow-bearer-header:false}")
    private boolean allowBearerHeader;

    public SecurityConfig(AppProperties properties, org.springframework.core.env.Environment environment) {
        this.properties = properties;
        this.environment = environment;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           JwtAuthenticationFilter jwtFilter,
                                           RateLimitingFilter rateLimitingFilter,
                                           CsrfCookieFilter csrfCookieFilter,
                                           MaintenanceFilter maintenanceFilter,
                                           ApiSecurityErrorHandler errorHandler) throws Exception {

        CookieCsrfTokenRepository csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfTokenRepository.setCookiePath("/");

        http
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfTokenRepository)
                        .ignoringRequestMatchers(request -> {
                            String path = request.getRequestURI();
                            if ("/api/payments/webhook".equals(path)) return true;

                            // Si authentifié par Bearer en mode autorisé : exempt de CSRF
                            String authHeader = request.getHeader("Authorization");
                            if (authHeader != null && authHeader.startsWith("Bearer ") && allowBearerHeader) {
                                return true;
                            }

                            // Si la requête ne porte aucun cookie d'authentification : CSRF non applicable (pas d'authentification ambiante)
                            boolean hasAuthCookie = false;
                            if (request.getCookies() != null) {
                                for (jakarta.servlet.http.Cookie c : request.getCookies()) {
                                    if (CookieAuthHelper.ACCESS_COOKIE_NAME.equals(c.getName()) ||
                                        CookieAuthHelper.REFRESH_COOKIE_NAME.equals(c.getName())) {
                                        hasAuthCookie = true;
                                        break;
                                    }
                                }
                            }
                            if (!hasAuthCookie) {
                                return true;
                            }

                            return false;
                        })
                )
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> {
                    headers
                        .contentTypeOptions(Customizer.withDefaults())
                        .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)
                        .contentSecurityPolicy(csp -> csp.policyDirectives(
                                "default-src 'self'; " +
                                "script-src 'self' https://unpkg.com https://cdn.jsdelivr.net 'unsafe-inline'; " +
                                "style-src 'self' https://fonts.googleapis.com https://cdn.jsdelivr.net 'unsafe-inline'; " +
                                "font-src 'self' https://fonts.gstatic.com; " +
                                "img-src 'self' data: https: blob:; " +
                                "connect-src 'self' https://geocoding-api.open-meteo.com; " +
                                "frame-ancestors 'none'; " +
                                "base-uri 'self'; " +
                                "form-action 'self'; " +
                                "object-src 'none'"
                        ))
                        .referrerPolicy(r -> r.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                        .permissionsPolicy(p -> p.policy("camera=(), microphone=(), geolocation=()"));

                    if (environment.acceptsProfiles(org.springframework.core.env.Profiles.of("prod"))) {
                        headers.httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31536000));
                    } else {
                        headers.httpStrictTransportSecurity(HeadersConfigurer.HstsConfig::disable);
                    }
                })
                .authorizeHttpRequests(auth -> {
                    if (environment.acceptsProfiles(org.springframework.core.env.Profiles.of("dev"))
                            && !environment.acceptsProfiles(org.springframework.core.env.Profiles.of("prod"))) {
                        auth.requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll();
                    } else {
                        auth.requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").denyAll();
                    }
                    auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers("/actuator", "/actuator/**").hasRole("ADMIN")
                        .requestMatchers("/api/status", "/api/auth/login", "/api/auth/register").permitAll()
                        .requestMatchers("/api/auth/refresh", "/api/auth/logout").permitAll()
                        .requestMatchers("/api/auth/logout-all").authenticated()
                        .requestMatchers(HttpMethod.POST,"/api/auth/forgot-password","/api/auth/reset-password","/api/auth/verify-email").permitAll()
                        .requestMatchers(HttpMethod.POST,"/api/auth/resend-verification").authenticated()
                        .requestMatchers(HttpMethod.POST,"/api/auth/change-password").authenticated()
                        .requestMatchers(HttpMethod.GET,"/api/users/me/export").authenticated()
                        .requestMatchers(HttpMethod.DELETE,"/api/users/me").authenticated()
                        .requestMatchers(HttpMethod.PUT,"/api/users/me/preferences").authenticated()
                        .requestMatchers(HttpMethod.POST,"/api/users/*/unlock").hasRole("ADMIN")
                        .requestMatchers("/api/suppliers/me/profile").hasRole("SUPPLIER")
                        .requestMatchers(HttpMethod.GET,"/api/suppliers/*/profile").hasRole("ADMIN")
                        .requestMatchers("/api/suppliers/**").denyAll()
                        .requestMatchers(HttpMethod.GET,"/api/files/*").permitAll()
                        .requestMatchers(HttpMethod.POST,"/api/files/images").authenticated()
                        .requestMatchers(HttpMethod.DELETE,"/api/files/*").authenticated()
                        .requestMatchers("/api/files/**").denyAll()
                        .requestMatchers(HttpMethod.POST, "/api/contact").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/currencies/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/offers/*/reviews", "/api/offers/*/reviews/summary").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/offers/*/reviews").hasRole("CLIENT")
                        .requestMatchers(HttpMethod.GET, "/api/reviews/moderation").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/reviews/*/moderate").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/reviews/*/reply").hasAnyRole("SUPPLIER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/reviews/*/report").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/reviews/*").hasRole("CLIENT")
                        .requestMatchers(HttpMethod.DELETE, "/api/reviews/*").hasAnyRole("CLIENT", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/offers/*/moderation").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/offers/**", "/api/cities/**", "/api/bundles/**").permitAll()
                        .requestMatchers("/api/users/**", "/api/cities/**").hasRole("ADMIN")
                        .requestMatchers("/api/offers/**").hasRole("SUPPLIER")
                        .requestMatchers("/api/bundles/**").hasRole("AGENT")
                        .requestMatchers("/api/cart/**").hasRole("CLIENT")
                        .requestMatchers(HttpMethod.POST,"/api/payments/webhook").permitAll()
                        .requestMatchers("/api/payments/admin","/api/payments/cash-pending","/api/payments/cash-history").hasAnyRole("AGENT","ADMIN")
                        .requestMatchers("/api/payments/mine").hasRole("CLIENT")
                        .requestMatchers(HttpMethod.POST,"/api/payments/*/refund").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST,"/api/payments/*/collect-cash").hasAnyRole("AGENT","ADMIN")
                        .requestMatchers(HttpMethod.POST,"/api/payments").hasRole("CLIENT")
                        .requestMatchers(HttpMethod.GET,"/api/payments","/api/payments/*","/api/payments/*/events").hasAnyRole("CLIENT","AGENT","ADMIN")
                        .requestMatchers("/api/payments/**").denyAll()
                        .requestMatchers("/api/bookings/supplier").hasRole("SUPPLIER")
                        .requestMatchers("/api/bookings/admin").hasAnyRole("ADMIN","AGENT")
                        .requestMatchers(HttpMethod.POST,"/api/bookings/*/confirm").hasAnyRole("ADMIN","AGENT")
                        .requestMatchers(HttpMethod.POST,"/api/bookings/*/cancel").hasAnyRole("CLIENT","ADMIN","AGENT")
                        .requestMatchers(HttpMethod.GET,"/api/bookings/*/voucher").hasAnyRole("CLIENT","ADMIN","AGENT")
                        .requestMatchers("/api/bookings").hasRole("CLIENT")
                        .requestMatchers(HttpMethod.GET,"/api/bookings/*").hasAnyRole("CLIENT","SUPPLIER","ADMIN","AGENT")
                        .requestMatchers("/api/bookings/**").denyAll()
                        .requestMatchers("/api/promo-codes/**").hasRole("ADMIN")
                        .requestMatchers("/api/notifications/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/tickets").hasAnyRole("CLIENT", "SUPPLIER")
                        .requestMatchers(HttpMethod.GET, "/api/tickets/stats").hasAnyRole("AGENT", "ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/tickets/*/assignee").hasAnyRole("AGENT", "ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/tickets/*/priority").hasAnyRole("AGENT", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/tickets/*").hasRole("ADMIN")
                        .requestMatchers("/api/tickets", "/api/tickets/**").authenticated()
                        .requestMatchers("/api/favorites", "/api/favorites/**").hasRole("CLIENT")
                        .requestMatchers("/api/audit", "/api/audit/**").hasRole("ADMIN")
                        .requestMatchers("/api/settings/public").permitAll()
                        .requestMatchers("/api/settings", "/api/settings/**").hasRole("ADMIN")
                        .requestMatchers(request -> request.getDispatcherType() == jakarta.servlet.DispatcherType.ASYNC
                            && Boolean.TRUE.equals(request.getAttribute(com.agence.voyage.service.StatsCsvService.AUTHORIZED_REQUEST_ATTRIBUTE)))
                            .permitAll()
                        .requestMatchers("/api/stats/admin","/api/stats/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/stats/supplier").hasRole("SUPPLIER")
                        .requestMatchers("/api/stats/agent").hasAnyRole("AGENT","ADMIN")
                        .requestMatchers("/api/stats/client").hasRole("CLIENT")
                        .requestMatchers("/api/stats/**").denyAll()
                        .anyRequest().authenticated();
                })
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(errorHandler)
                        .accessDeniedHandler(errorHandler))
                .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(csrfCookieFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(maintenanceFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public org.springframework.web.filter.CorsFilter corsFilter(
            @org.springframework.beans.factory.annotation.Qualifier("corsConfigurationSource") CorsConfigurationSource source,
            ApiSecurityErrorHandler errors) {
        var filter = new org.springframework.web.filter.CorsFilter(source);
        filter.setCorsProcessor(new org.springframework.web.cors.DefaultCorsProcessor() {
            @Override
            protected void rejectRequest(org.springframework.http.server.ServerHttpResponse response) {
                response.setStatusCode(org.springframework.http.HttpStatus.FORBIDDEN);
            }
            @Override
            public boolean processRequest(CorsConfiguration config, jakarta.servlet.http.HttpServletRequest request,
                    jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {
                boolean valid = super.processRequest(config, request, response);
                if (!valid) errors.handle(request, response,
                        new org.springframework.security.access.AccessDeniedException("Origine non autorisée"));
                return valid;
            }
        });
        return filter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        if (environment.acceptsProfiles(org.springframework.core.env.Profiles.of("dev"))
                && !environment.acceptsProfiles(org.springframework.core.env.Profiles.of("prod"))) {
            // VS Code Live Server choisit souvent un autre port si 5500 est occupé.
            // La production reste limitée à la liste explicite configurée ci-dessous.
            config.setAllowedOriginPatterns(List.of("http://localhost:*", "http://127.0.0.1:*"));
        } else {
            config.setAllowedOrigins(properties.cors().allowedOrigins());
        }
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Correlation-Id",
                "X-XSRF-TOKEN", "Idempotency-Key", "X-Atlas-Signature", "X-Atlas-Timestamp"));
        config.setExposedHeaders(List.of("X-Correlation-Id", "Content-Disposition", "Retry-After"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
