package com.agence.voyage.exception;
import org.springframework.http.HttpStatus;

public class ForbiddenException extends BusinessException {
    public ForbiddenException(String message) { this(ErrorCode.FORBIDDEN, message); }
    public ForbiddenException(ErrorCode code, String message) { super(code, HttpStatus.FORBIDDEN, message); }
}
