package com.agence.voyage.security;

import com.agence.voyage.dto.ApiError;
import com.agence.voyage.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.access.AccessDeniedException;
import java.io.IOException;

@Component
public class ApiSecurityErrorHandler implements AuthenticationEntryPoint, AccessDeniedHandler {
    private final ObjectMapper mapper;
    public ApiSecurityErrorHandler(ObjectMapper mapper) { this.mapper = mapper; }

    @Override
    public void commence(HttpServletRequest req, HttpServletResponse res, AuthenticationException ex) throws IOException {
        ErrorCode code = req.getAttribute("authErrorCode") instanceof ErrorCode c ? c : ErrorCode.UNAUTHORIZED;
        String message = switch (code) {
            case TOKEN_EXPIRED -> "Votre session a expiré : reconnectez-vous";
            case TOKEN_REVOKED -> "Votre session a été révoquée : reconnectez-vous";
            case ACCOUNT_ARCHIVED -> "Ce compte est désactivé";
            default -> "Authentification requise : veuillez vous connecter";
        };
        write(req, res, 401, code, message);
    }
    @Override
    public void handle(HttpServletRequest req, HttpServletResponse res, AccessDeniedException ex) throws IOException {
        write(req, res, 403, ErrorCode.FORBIDDEN, "Accès refusé : droits insuffisants");
    }
    private void write(HttpServletRequest req, HttpServletResponse res, int status, ErrorCode code, String message) throws IOException {
        res.setStatus(status);
        res.setContentType("application/json");
        res.setCharacterEncoding("UTF-8");
        mapper.writeValue(res.getOutputStream(), ApiError.of(status, code, message, null, req));
    }
}
