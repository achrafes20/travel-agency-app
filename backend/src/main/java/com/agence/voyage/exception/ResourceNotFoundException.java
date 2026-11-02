package com.agence.voyage.exception;
import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends BusinessException {
    public ResourceNotFoundException(String message) { super(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, message); }
}
