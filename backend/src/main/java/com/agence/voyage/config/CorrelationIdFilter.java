package com.agence.voyage.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.slf4j.*;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.UUID;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter extends OncePerRequestFilter {
    public static final String HEADER = "X-Correlation-Id";
    private static final Logger log = LoggerFactory.getLogger(CorrelationIdFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String supplied = request.getHeader(HEADER);
        String id = supplied != null && supplied.matches("[A-Za-z0-9-]{1,64}") ? supplied : UUID.randomUUID().toString();
        MDC.put("correlationId", id);
        response.setHeader(HEADER, id);
        long start = System.nanoTime();
        try { chain.doFilter(request, response); }
        finally {
            // Aucun corps, query string, token ou identifiant personnel.
            log.info("access method={} path={} status={} durationMs={}",
                    request.getMethod(), request.getRequestURI(), response.getStatus(),
                    (System.nanoTime() - start) / 1_000_000);
            MDC.remove("userId");
            MDC.remove("correlationId");
        }
    }
}
