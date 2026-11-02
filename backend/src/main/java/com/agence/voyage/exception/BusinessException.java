package com.agence.voyage.exception;

import org.springframework.http.HttpStatus;

public class BusinessException extends RuntimeException {
    private final ErrorCode code;
    private final HttpStatus status;

    /** Compatibilité avec les règles existantes : HTTP 400. */
    public BusinessException(String message) { this(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST, message); }
    public BusinessException(ErrorCode code, String message) { this(code, HttpStatus.BAD_REQUEST, message); }
    public BusinessException(ErrorCode code, HttpStatus status, String message) {
        super(message);
        this.code = code;
        this.status = status;
    }
    public ErrorCode getCode() { return code; }
    public HttpStatus getStatus() { return status; }
}
