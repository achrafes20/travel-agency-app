package com.agence.voyage.exception;
import org.springframework.http.HttpStatus;
public class AuthRateLimitException extends BusinessException {
    private final long retryAfter;
    public AuthRateLimitException(long seconds){super(ErrorCode.AUTH_RATE_LIMITED,HttpStatus.TOO_MANY_REQUESTS,"Trop de demandes. Réessayez dans "+seconds+" secondes.");retryAfter=seconds;}
    public long getRetryAfter(){return retryAfter;}
}
