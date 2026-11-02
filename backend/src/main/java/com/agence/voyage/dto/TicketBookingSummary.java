package com.agence.voyage.dto;

import com.agence.voyage.entity.Booking;

public record TicketBookingSummary(Long id, String reference) {

    public static TicketBookingSummary from(Booking booking) {
        if (booking == null) {
            return null;
        }
        return new TicketBookingSummary(booking.getId(), booking.getReference());
    }
}

