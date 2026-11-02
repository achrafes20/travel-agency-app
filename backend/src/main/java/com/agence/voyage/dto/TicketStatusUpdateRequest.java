package com.agence.voyage.dto;

import com.agence.voyage.entity.TicketStatus;
import jakarta.validation.constraints.NotNull;

public record TicketStatusUpdateRequest(
    @NotNull(message = "Le statut est obligatoire")
    TicketStatus status
) {}

