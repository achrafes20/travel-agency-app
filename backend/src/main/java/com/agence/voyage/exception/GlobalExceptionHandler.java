package com.agence.voyage.exception;

import com.agence.voyage.dto.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private org.springframework.context.MessageSource messageSource;

    private String resolveMessage(ErrorCode code, String fallback) {
        if (messageSource != null && code != null) {
            java.util.Locale locale = org.springframework.context.i18n.LocaleContextHolder.getLocale();
            try {
                return messageSource.getMessage("error." + code.name(), null, fallback, locale);
            } catch (Exception e) {
                return fallback;
            }
        }
        return fallback;
    }
    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiError> uploadTooLarge(Exception ex,HttpServletRequest request){log.info("image_refused code=UPLOAD_TOO_LARGE");return response(HttpStatus.PAYLOAD_TOO_LARGE,ErrorCode.UPLOAD_TOO_LARGE,"Le fichier dépasse la taille maximale autorisée",null,request);}
    @ExceptionHandler(org.springframework.web.multipart.MultipartException.class)
    public ResponseEntity<ApiError> multipart(Exception ex,HttpServletRequest request){return response(HttpStatus.BAD_REQUEST,ErrorCode.BAD_REQUEST,"Formulaire multipart invalide",null,request);}

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiError> business(BusinessException ex, HttpServletRequest request) {
        log.debug("business_error code={} status={}", ex.getCode(), ex.getStatus().value());
        if(request.getMethod().equals("POST")&&request.getRequestURI().equals("/api/files/images"))log.info("image_refused code={} status={}",ex.getCode(),ex.getStatus().value());
        var details=ex instanceof PasswordPolicyException policy?policy.getRules().stream().map(rule->new ApiError.FieldError("newPassword",rule)).toList():null;
        String localizedMsg = resolveMessage(ex.getCode(), ex.getMessage());
        ResponseEntity<ApiError> result=response(ex.getStatus(), ex.getCode(), localizedMsg, details, request);
        return ex instanceof AuthRateLimitException limit?ResponseEntity.status(ex.getStatus()).header("Retry-After",Long.toString(limit.getRetryAfter())).body(result.getBody()):result;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> validation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        var details = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> new ApiError.FieldError(e.getField(), e.getDefaultMessage())).toList();
        String msg = resolveMessage(ErrorCode.VALIDATION_ERROR, "Certains champs sont invalides");
        return response(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR,
                msg, details, request);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> constraints(ConstraintViolationException ex, HttpServletRequest request) {
        var details = ex.getConstraintViolations().stream()
                .map(e -> new ApiError.FieldError(e.getPropertyPath().toString(), e.getMessage())).toList();
        return response(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR,
                "Certains paramètres sont invalides", details, request);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class, ServletRequestBindingException.class})
    public ResponseEntity<ApiError> badRequest(Exception ex, HttpServletRequest request) {
        return response(HttpStatus.BAD_REQUEST, ErrorCode.BAD_REQUEST,
                "Requête invalide : vérifiez le JSON et les paramètres", null, request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> forbidden(AccessDeniedException ex, HttpServletRequest request) {
        return response(HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN, "Accès refusé : droits insuffisants", null, request);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> unauthorized(AuthenticationException ex, HttpServletRequest request) {
        return response(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED, "Authentification requise", null, request);
    }

    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiError> method(Exception ex, HttpServletRequest request) {
        return response(HttpStatus.METHOD_NOT_ALLOWED, ErrorCode.BAD_REQUEST, "Méthode HTTP non autorisée", null, request);
    }

    @ExceptionHandler(org.springframework.web.HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiError> media(Exception ex, HttpServletRequest request) {
        return response(HttpStatus.UNSUPPORTED_MEDIA_TYPE, ErrorCode.BAD_REQUEST, "Format de contenu non pris en charge", null, request);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> conflict(DataIntegrityViolationException ex, HttpServletRequest request) {
        return response(HttpStatus.CONFLICT, ErrorCode.CONFLICT,
                "Cette opération entre en conflit avec les données existantes", null, request);
    }

    @ExceptionHandler({NoHandlerFoundException.class, NoResourceFoundException.class})
    public ResponseEntity<ApiError> notFound(Exception ex, HttpServletRequest request) {
        return response(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, "Ressource introuvable", null, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> unexpected(Exception ex, HttpServletRequest request) {
        // Type et stack côté serveur seulement ; aucun message interne renvoyé au client.
        log.error("internal_error correlationId={} type={}", MDC.get("correlationId"), ex.getClass().getName(), ex);
        return response(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_ERROR,
                "Une erreur interne est survenue", null, request);
    }

    private ResponseEntity<ApiError> response(HttpStatus status, ErrorCode code, String message,
                                              List<ApiError.FieldError> details, HttpServletRequest request) {
        return ResponseEntity.status(status).body(ApiError.of(status.value(), code, message, details, request));
    }
}
