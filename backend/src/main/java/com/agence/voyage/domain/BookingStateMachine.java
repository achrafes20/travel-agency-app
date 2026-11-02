package com.agence.voyage.domain;

import com.agence.voyage.entity.BookingStatus;
import com.agence.voyage.exception.*;
import java.util.*;

public final class BookingStateMachine {
    private static final Map<BookingStatus, Set<BookingStatus>> ALLOWED = Map.of(
            BookingStatus.PENDING, Set.of(BookingStatus.CONFIRMED, BookingStatus.CANCELLED, BookingStatus.EXPIRED),
            BookingStatus.CONFIRMED, Set.of(BookingStatus.COMPLETED, BookingStatus.CANCELLED));
    public BookingStatus transition(BookingStatus from, BookingStatus to) {
        if (from == null || to == null || !ALLOWED.getOrDefault(from, Set.of()).contains(to)) {
            throw new BusinessException(ErrorCode.INVALID_STATE_TRANSITION, "Transition de réservation interdite");
        }
        return to;
    }
}
