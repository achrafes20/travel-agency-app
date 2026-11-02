package com.agence.voyage.dto;

import com.agence.voyage.entity.Ticket;
import com.agence.voyage.entity.TicketCategory;
import com.agence.voyage.entity.TicketPriority;
import com.agence.voyage.entity.TicketStatus;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

public record TicketResponse(
    Long id,
    String reference,
    String subject,
    TicketCategory category,
    TicketPriority priority,
    TicketStatus status,
    TicketUserSummary requester,
    TicketUserSummary assignee,
    TicketBookingSummary booking,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    LocalDateTime resolvedAt,
    LocalDateTime closedAt,
    int messageCount,
    String lastMessagePreview,
    LocalDateTime lastMessageAt,
    List<TicketMessageResponse> messages
) {
    public static TicketResponse from(Ticket ticket, int messageCount, String lastMessagePreview,
                                      LocalDateTime lastMessageAt, List<TicketMessageResponse> messages) {
        if (ticket == null) {
            return null;
        }
        return new TicketResponse(
            ticket.getId(),
            ticket.getReference(),
            ticket.getSubject(),
            ticket.getCategory(),
            ticket.getPriority(),
            ticket.getStatus(),
            TicketUserSummary.from(ticket.getRequester()),
            TicketUserSummary.from(ticket.getAssignee()),
            TicketBookingSummary.from(ticket.getBooking()),
            ticket.getCreatedAt(),
            ticket.getUpdatedAt(),
            ticket.getResolvedAt(),
            ticket.getClosedAt(),
            messageCount,
            lastMessagePreview,
            lastMessageAt,
            messages != null ? messages : Collections.emptyList()
        );
    }
}

