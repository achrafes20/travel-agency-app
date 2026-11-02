package com.agence.voyage.dto;

import com.agence.voyage.entity.TicketPriority;
import jakarta.validation.constraints.NotNull;

public record TicketPriorityUpdateRequest(
    @NotNull(message = "La priorité est obligatoire")
    TicketPriority priority
) {}

