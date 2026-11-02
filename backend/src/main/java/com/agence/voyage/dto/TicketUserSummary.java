package com.agence.voyage.dto;

import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.User;

public record TicketUserSummary(Long id, String fullName, Role role) {

    public static TicketUserSummary from(User user) {
        if (user == null) {
            return null;
        }
        return new TicketUserSummary(user.getId(), user.getFullName(), user.getRole());
    }
}

