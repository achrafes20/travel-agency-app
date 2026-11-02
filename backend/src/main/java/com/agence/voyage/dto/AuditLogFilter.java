package com.agence.voyage.dto;

import com.agence.voyage.entity.AuditLog;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public record AuditLogFilter(
        LocalDate startDate,
        LocalDate endDate,
        String actor,
        String action,
        String resourceType,
        Long resourceId,
        String search
) {
    private static String escapeLike(String input) {
        if (input == null) return "";
        return input.trim().toLowerCase()
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }

    public Specification<AuditLog> toSpecification() {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate.atStartOfDay()));
            }

            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate.atTime(LocalTime.MAX)));
            }

            if (actor != null && !actor.isBlank()) {
                String term = "%" + escapeLike(actor) + "%";
                Predicate emailMatch = cb.like(cb.lower(root.get("actorEmail")), term, '\\');
                Predicate roleMatch = cb.like(cb.lower(root.get("actorRole")), term, '\\');
                predicates.add(cb.or(emailMatch, roleMatch));
            }

            if (action != null && !action.isBlank()) {
                predicates.add(cb.equal(root.get("action"), action.trim()));
            }

            if (resourceType != null && !resourceType.isBlank()) {
                predicates.add(cb.equal(root.get("resourceType"), resourceType.trim()));
            }

            if (resourceId != null) {
                predicates.add(cb.equal(root.get("resourceId"), resourceId));
            }

            if (search != null && !search.isBlank()) {
                String term = "%" + escapeLike(search) + "%";
                Predicate descMatch = cb.like(cb.lower(root.get("description")), term, '\\');
                Predicate actorMatch = cb.like(cb.lower(root.get("actorEmail")), term, '\\');
                Predicate actionMatch = cb.like(cb.lower(root.get("action")), term, '\\');
                Predicate resourceMatch = cb.like(cb.lower(root.get("resourceType")), term, '\\');
                predicates.add(cb.or(descMatch, actorMatch, actionMatch, resourceMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
