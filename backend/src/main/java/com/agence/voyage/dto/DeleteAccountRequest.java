package com.agence.voyage.dto;

import jakarta.validation.constraints.NotBlank;

public record DeleteAccountRequest(
        @NotBlank(message = "Le mot de passe actuel est obligatoire pour confirmer la suppression")
        String password,
        String reason
) {}

