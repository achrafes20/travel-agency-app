package com.agence.voyage.dto;

public record PublicSettingsResponse(
        String currencyDefault,
        boolean paymentCashEnabled,
        int offersImagesMax,
        boolean maintenanceEnabled,
        String maintenanceMessage
) {
}

