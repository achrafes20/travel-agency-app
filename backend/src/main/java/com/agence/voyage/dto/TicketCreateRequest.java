package com.agence.voyage.dto;

import com.agence.voyage.entity.TicketCategory;
import com.agence.voyage.entity.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record TicketCreateRequest(
    @NotBlank(message = "Le sujet est obligatoire")
    @Size(min = 5, max = 150, message = "Le sujet doit comporter entre 5 et 150 caractères")
    String subject,

    @NotNull(message = "La catégorie est obligatoire")
    TicketCategory category,

    TicketPriority priority,

    Long bookingId,

    @NotBlank(message = "Le message initial est obligatoire")
    @Size(min = 1, max = 5000, message = "Le message doit comporter entre 1 et 5000 caractères")
    String message,

    List<TicketAttachmentDto> attachments
) {
    public TicketPriority effectivePriority() {
        return priority != null ? priority : TicketPriority.MEDIUM;
    }
}

