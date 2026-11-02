package com.agence.voyage.dto;
import jakarta.validation.constraints.Size;
public record CancelBookingRequest(@Size(max=1000) String reason) {}

