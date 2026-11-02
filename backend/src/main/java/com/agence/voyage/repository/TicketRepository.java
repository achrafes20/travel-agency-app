package com.agence.voyage.repository;

import com.agence.voyage.entity.Ticket;
import com.agence.voyage.entity.TicketPriority;
import com.agence.voyage.entity.TicketStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {

    @Override
    @EntityGraph(attributePaths = {"requester", "assignee", "booking"})
    Page<Ticket> findAll(Specification<Ticket> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"requester", "assignee", "booking"})
    @Query("select t from Ticket t where t.id = :id")
    Optional<Ticket> findWithDetailsById(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Ticket t where t.id = :id")
    Optional<Ticket> lockById(Long id);

    long countByStatus(TicketStatus status);

    long countByPriority(TicketPriority priority);

    boolean existsByReference(String reference);
}

