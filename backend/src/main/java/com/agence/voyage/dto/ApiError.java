package com.agence.voyage.dto;

import com.agence.voyage.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.MDC;
import java.time.Instant;
import java.util.List;

public record ApiError(Instant timestamp, int status, String code, String message,
                       List<FieldError> details, String path, String correlationId) {
    public record FieldError(String field, String message) {}
    public static ApiError of(int status, ErrorCode code, String message,
                              List<FieldError> details, HttpServletRequest request) {
        return new ApiError(Instant.now(), status, code.name(), message, details,
                request.getRequestURI(), MDC.get("correlationId"));
    }
}
