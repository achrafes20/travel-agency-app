package com.agence.voyage.dto;

import com.agence.voyage.entity.Setting;
import com.agence.voyage.entity.SettingType;

import java.time.LocalDateTime;

public record SettingResponse(
        Long id,
        String settingKey,
        String settingValue,
        SettingType valueType,
        String description,
        Double minValue,
        Double maxValue,
        LocalDateTime updatedAt,
        String updatedBy
) {
    public static SettingResponse from(Setting setting) {
        return new SettingResponse(
                setting.getId(),
                setting.getSettingKey(),
                setting.getSettingValue(),
                setting.getValueType(),
                setting.getDescription(),
                setting.getMinValue(),
                setting.getMaxValue(),
                setting.getUpdatedAt(),
                setting.getUpdatedBy()
        );
    }
}

