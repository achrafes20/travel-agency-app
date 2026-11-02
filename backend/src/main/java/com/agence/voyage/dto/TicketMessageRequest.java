package com.agence.voyage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record TicketMessageRequest(
    @NotBlank(message = "Le contenu du message est obligatoire")
    @Size(min = 1, max = 5000, message = "Le message doit comporter entre 1 et 5000 caractères")
    String content,

    Boolean internalNote,

    List<TicketAttachmentDto> attachments
) {
    public boolean effectiveInternalNote() {
        return Boolean.TRUE.equals(internalNote);
    }
}

