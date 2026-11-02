package com.agence.voyage.dto;

import jakarta.validation.constraints.NotNull;
import java.util.Map;

public record SettingBulkUpdateRequest(
        @NotNull(message = "Les paramtres ne peuvent pas Ǧtre nuls")
        Map<String, String> settings
) {
}

