package com.agence.voyage.dto;

public record TicketStatsResponse(
    long total,
    long open,
    long inProgress,
    long resolved,
    long closed,
    long lowPriority,
    long mediumPriority,
    long highPriority,
    long urgentPriority
) {}

