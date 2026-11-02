package com.agence.voyage.dto;

import jakarta.validation.constraints.NotNull;

public record SettingUpdateRequest(
        @NotNull(message = "La valeur du paramètre est obligatoire")
        String value
) {}

