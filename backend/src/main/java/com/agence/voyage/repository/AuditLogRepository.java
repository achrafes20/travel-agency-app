package com.agence.voyage.repository;

import com.agence.voyage.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository append-only pour les logs d'audit.
 * N'Ǹtend pas JpaRepository pour interdire formellement toute mǸthode delete/deleteAll.
 */
public interface AuditLogRepository extends Repository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    AuditLog save(AuditLog log);

    Optional<AuditLog> findById(Long id);

    List<AuditLog> findAll();

    Page<AuditLog> findAll(Specification<AuditLog> spec, Pageable pageable);

    List<AuditLog> findAll(Specification<AuditLog> spec, Sort sort);

    List<AuditLog> findByResourceTypeAndResourceIdOrderByIdAsc(String resourceType, Long resourceId);

    long count();
}
