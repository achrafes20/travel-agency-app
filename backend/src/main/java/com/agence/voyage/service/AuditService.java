package com.agence.voyage.service;

import com.agence.voyage.dto.AuditLogFilter;
import com.agence.voyage.dto.AuditLogResponse;
import com.agence.voyage.entity.AuditAction;
import com.agence.voyage.entity.AuditLog;
import com.agence.voyage.entity.User;
import com.agence.voyage.exception.ResourceNotFoundException;
import com.agence.voyage.repository.AuditLogRepository;
import com.agence.voyage.security.AppUserDetails;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);
    private static final Set<String> SENSITIVE_KEYS = Set.of(
            "password", "newpassword", "currentpassword", "confirmpassword", "hash", "token", "secret", "cvv", "cvc", "cardnumber"
    );

    private final AuditLogRepository repository;
    private final Clock clock;
    private final ObjectMapper mapper;

    public AuditService(AuditLogRepository repository, Clock clock, ObjectMapper mapper) {
        this.repository = repository;
        this.clock = clock;
        this.mapper = mapper;
    }

    /**
     * Méthode de compatibilité existante (utilisée par PaymentLedger et StatsDemoSeeder).
     * Participe à la transaction appelante lorsqu'elle existe pour éviter tout interblocage de pool.
     */
    @Transactional
    public void log(User actor, String action, Long paymentId, String before, String after) {
        AuditLog row = new AuditLog();
        row.setActor(actor);
        row.setActorRole(actor == null ? "SYSTEM" : (actor.getRole() != null ? actor.getRole().name() : "SYSTEM"));
        row.setAction(action);
        row.setResourceType("PAYMENT");
        row.setResourceId(paymentId);
        row.setDescription("Action de paiement : " + action);
        row.setBeforeJson(sanitizeJson(before));
        row.setAfterJson(sanitizeJson(after));
        row.setCreatedAt(LocalDateTime.now(clock));

        HttpServletRequest req = currentRequest();
        row.setIpAddress(extractIp(req));
        row.setUserAgent(extractUserAgent(req));

        repository.save(row);
    }

    /**
     * Journalisation automatique avec récupération de l'acteur depuis le contexte de sécurité.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(AuditAction action, String resourceType, Long resourceId, String description, Object before, Object after) {
        log(action != null ? action.name() : "UNKNOWN", resourceType, resourceId, description, before, after);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String resourceType, Long resourceId, String description, Object before, Object after) {
        Long actorId = null;
        String actorEmail = "SYSTEM";
        String actorRole = "SYSTEM";

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof AppUserDetails userDetails) {
            actorId = userDetails.getId();
            actorEmail = userDetails.getUsername();
            actorRole = userDetails.getRole() != null ? userDetails.getRole().name() : "CLIENT";
        } else if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof String principalStr) {
            actorEmail = principalStr;
        }

        logAs(actorId, actorEmail, actorRole, action, resourceType, resourceId, description, before, after);
    }

    /**
     * Variante pour les cas sans utilisateur authentifié (ex: échec de connexion).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAs(Long actorId, String actorEmail, String actorRole, AuditAction action, String resourceType, Long resourceId, String description, Object before, Object after) {
        logAs(actorId, actorEmail, actorRole, action != null ? action.name() : "UNKNOWN", resourceType, resourceId, description, before, after);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAs(Long actorId, String actorEmail, String actorRole, String action, String resourceType, Long resourceId,
                      String description, Object before, Object after) {
        try {
            AuditLog row = new AuditLog();
            row.setActorId(actorId);
            row.setActorEmail(actorEmail != null ? actorEmail : "anonymous");
            row.setActorRole(actorRole != null ? actorRole : "ANONYMOUS");
            row.setAction(action);
            row.setResourceType(resourceType);
            row.setResourceId(resourceId);
            row.setDescription(description);
            row.setBeforeJson(toJsonString(before));
            row.setAfterJson(toJsonString(after));
            row.setCreatedAt(LocalDateTime.now(clock));

            HttpServletRequest req = currentRequest();
            row.setIpAddress(extractIp(req));
            row.setUserAgent(extractUserAgent(req));

            repository.save(row);
        } catch (Exception ex) {
            // L'audit ne doit jamais interrompre l'exécution métier principale
            log.error("audit_log_failed action={} resourceType={} error={}", action, resourceType, ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> findAll(AuditLogFilter filter, Pageable pageable) {
        return repository.findAll(filter.toSpecification(), pageable)
                .map(AuditLogResponse::from);
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> findAllForExport(AuditLogFilter filter, Sort sort, int limit) {
        List<AuditLog> all = repository.findAll(filter.toSpecification(), sort);
        if (all.size() > limit) {
            all = all.subList(0, limit);
        }
        return all.stream().map(AuditLogResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public AuditLogResponse findById(Long id) {
        return repository.findById(id)
                .map(AuditLogResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Entrée d'audit introuvable : id=" + id));
    }

    private HttpServletRequest currentRequest() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            return attributes.getRequest();
        }
        return null;
    }

    private String extractIp(HttpServletRequest req) {
        if (req == null) return "127.0.0.1";
        String xf = req.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            String ip = xf.split(",")[0].trim();
            if (ip.length() <= 64) return ip;
        }
        String remote = req.getRemoteAddr();
        return remote != null ? remote : "127.0.0.1";
    }

    private String extractUserAgent(HttpServletRequest req) {
        if (req == null) return null;
        String ua = req.getHeader("User-Agent");
        if (ua != null && ua.length() > 255) {
            return ua.substring(0, 255);
        }
        return ua;
    }

    private String toJsonString(Object obj) {
        if (obj == null) return null;
        if (obj instanceof String str) return sanitizeJson(str);
        try {
            JsonNode node = mapper.valueToTree(obj);
            maskSensitiveFields(node);
            return mapper.writeValueAsString(node);
        } catch (Exception e) {
            return null;
        }
    }

    private String sanitizeJson(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            JsonNode node = mapper.readTree(json);
            maskSensitiveFields(node);
            return mapper.writeValueAsString(node);
        } catch (Exception e) {
            // Pas un JSON valide, retourner tel quel sauf si clés sensibles détectées
            return json;
        }
    }

    private void maskSensitiveFields(JsonNode node) {
        if (node == null) return;
        if (node.isObject()) {
            ObjectNode objectNode = (ObjectNode) node;
            Iterator<String> fieldNames = objectNode.fieldNames();
            while (fieldNames.hasNext()) {
                String fieldName = fieldNames.next();
                if (SENSITIVE_KEYS.contains(fieldName.toLowerCase())) {
                    objectNode.put(fieldName, "******");
                } else {
                    maskSensitiveFields(objectNode.get(fieldName));
                }
            }
        } else if (node.isArray()) {
            for (JsonNode child : node) {
                maskSensitiveFields(child);
            }
        }
    }
}
