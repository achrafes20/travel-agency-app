package com.agence.voyage.repository;

import com.agence.voyage.entity.TicketMessage;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface TicketMessageRepository extends JpaRepository<TicketMessage, Long> {

    @EntityGraph(attributePaths = {"author", "attachments"})
    List<TicketMessage> findByTicketIdOrderByCreatedAtAsc(Long ticketId);

    @EntityGraph(attributePaths = {"author", "attachments"})
    List<TicketMessage> findByTicketIdInOrderByCreatedAtAsc(Collection<Long> ticketIds);

    long countByTicketId(Long ticketId);

    long countByTicketIdAndInternalNoteFalse(Long ticketId);
}

