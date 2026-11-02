package com.agence.voyage.dto;
import com.agence.voyage.entity.PaymentMethod;
import jakarta.validation.constraints.*;
public record CreateBookingRequest(@NotNull PaymentMethod paymentMethod, @Size(max=40) String contactPhone, @Size(max=2000) String notes) {}

