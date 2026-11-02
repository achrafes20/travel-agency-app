package com.agence.voyage.dto;

import com.agence.voyage.entity.TicketMessage;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

public record TicketMessageResponse(
    Long id,
    TicketUserSummary author,
    String content,
    boolean internalNote,
    LocalDateTime createdAt,
    List<TicketAttachmentDto> attachments
) {
    public static TicketMessageResponse from(TicketMessage message) {
        if (message == null) {
            return null;
        }
        List<TicketAttachmentDto> attachmentDtos = message.getAttachments() != null
            ? message.getAttachments().stream().map(TicketAttachmentDto::from).toList()
            : Collections.emptyList();
        return new TicketMessageResponse(
            message.getId(),
            TicketUserSummary.from(message.getAuthor()),
            message.getContent(),
            message.isInternalNote(),
            message.getCreatedAt(),
            attachmentDtos
        );
    }
}

