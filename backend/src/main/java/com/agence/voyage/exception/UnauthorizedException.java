package com.agence.voyage.exception;
import org.springframework.http.HttpStatus;

public class UnauthorizedException extends BusinessException {
    public UnauthorizedException(String message) { this(ErrorCode.UNAUTHORIZED, message); }
    public UnauthorizedException(ErrorCode code, String message) { super(code, HttpStatus.UNAUTHORIZED, message); }
}
