package com.agence.voyage.service;

import com.agence.voyage.dto.PublicSettingsResponse;
import com.agence.voyage.dto.SettingResponse;
import com.agence.voyage.entity.AuditAction;
import com.agence.voyage.entity.Setting;
import com.agence.voyage.entity.SettingKeys;
import com.agence.voyage.entity.SettingType;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.exception.ErrorCode;
import com.agence.voyage.exception.ResourceNotFoundException;
import com.agence.voyage.repository.SettingRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SettingService {

    private static final Logger log = LoggerFactory.getLogger(SettingService.class);
    private static final Set<String> ALLOWED_CURRENCIES = Set.of("MAD", "EUR", "USD", "GBP");

    private final SettingRepository settingRepository;
    private final AuditService auditService;
    private final Map<String, Setting> cache = new ConcurrentHashMap<>();

    public SettingService(SettingRepository settingRepository, AuditService auditService) {
        this.settingRepository = settingRepository;
        this.auditService = auditService;
    }

    @PostConstruct
    public void initCache() {
        refreshCache();
    }

    public synchronized void refreshCache() {
        cache.clear();
        for (Setting s : settingRepository.findAll()) {
            cache.put(s.getSettingKey(), s);
        }
        log.info("settings_cache_refreshed count={}", cache.size());
    }

    public String getString(String key) {
        Setting s = cache.get(key);
        if (s != null && s.getSettingValue() != null) {
            return s.getSettingValue();
        }
        return defaultString(key);
    }

    public int getInt(String key) {
        String val = getString(key);
        try {
            return Integer.parseInt(val);
        } catch (NumberFormatException e) {
            return defaultInt(key);
        }
    }

    public boolean getBoolean(String key) {
        String val = getString(key);
        return Boolean.parseBoolean(val);
    }

    public double getDecimal(String key) {
        String val = getString(key);
        try {
            return Double.parseDouble(val);
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    @Transactional(readOnly = true)
    public List<SettingResponse> getAll() {
        return settingRepository.findAllByOrderBySettingKeyAsc().stream()
                .map(SettingResponse::from)
                .toList();
    }

    public PublicSettingsResponse getPublicSettings() {
        return new PublicSettingsResponse(
                getString(SettingKeys.CURRENCY_DEFAULT),
                getBoolean(SettingKeys.PAYMENT_CASH_ENABLED),
                getInt(SettingKeys.OFFERS_IMAGES_MAX),
                getBoolean(SettingKeys.MAINTENANCE_ENABLED),
                getString(SettingKeys.MAINTENANCE_MESSAGE)
        );
    }

    @Transactional
    public SettingResponse update(String key, String value, String updatedBy) {
        Setting setting = settingRepository.findBySettingKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Paramtre introuvable : " + key));

        validateSettingValue(setting, value);

        String before = setting.getSettingValue();
        setting.setSettingValue(value != null ? value.trim() : null);
        setting.setUpdatedAt(LocalDateTime.now());
        setting.setUpdatedBy(updatedBy != null ? updatedBy : "ADMIN");

        Setting saved = settingRepository.save(setting);
        refreshCache();

        auditService.log(
                AuditAction.SETTING_UPDATED.name(),
                "SETTING",
                saved.getId(),
                "Modification du paramtre " + key + " = " + value,
                "{\"key\":\"" + key + "\",\"value\":\"" + (before != null ? before : "") + "\"}",
                "{\"key\":\"" + key + "\",\"value\":\"" + (value != null ? value : "") + "\"}"
        );

        return SettingResponse.from(saved);
    }

    @Transactional
    public List<SettingResponse> updateAll(Map<String, String> newSettings, String updatedBy) {
        if (newSettings == null || newSettings.isEmpty()) {
            return getAll();
        }

        // 1. Validation de l'intgralit des modifications en amont (atomicit stricte : tout ou rien)
        Map<Setting, String> validatedUpdates = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : newSettings.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();

            Setting setting = settingRepository.findBySettingKey(key)
                    .orElseThrow(() -> new ResourceNotFoundException("Paramtre introuvable : " + key));

            validateSettingValue(setting, value);
            validatedUpdates.put(setting, value != null ? value.trim() : null);
        }

        // 2. Application des modifications et criture de l'audit
        List<Setting> updatedList = new ArrayList<>();
        for (Map.Entry<Setting, String> entry : validatedUpdates.entrySet()) {
            Setting setting = entry.getKey();
            String newValue = entry.getValue();
            String before = setting.getSettingValue();

            setting.setSettingValue(newValue);
            setting.setUpdatedAt(LocalDateTime.now());
            setting.setUpdatedBy(updatedBy != null ? updatedBy : "ADMIN");

            Setting saved = settingRepository.save(setting);
            updatedList.add(saved);

            auditService.log(
                    AuditAction.SETTING_UPDATED.name(),
                    "SETTING",
                    saved.getId(),
                    "Modification du paramtre " + setting.getSettingKey() + " = " + newValue,
                    "{\"key\":\"" + setting.getSettingKey() + "\",\"value\":\"" + (before != null ? before : "") + "\"}",
                    "{\"key\":\"" + setting.getSettingKey() + "\",\"value\":\"" + (newValue != null ? newValue : "") + "\"}"
            );
        }

        refreshCache();

        return updatedList.stream().map(SettingResponse::from).toList();
    }

    private void validateSettingValue(Setting setting, String value) {
        if (value == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "La valeur du paramtre " + setting.getSettingKey() + " ne peut pas Ǧtre nulle");
        }

        String trimmed = value.trim();
        String key = setting.getSettingKey();

        switch (setting.getValueType()) {
            case INTEGER -> {
                int intVal;
                try {
                    intVal = Integer.parseInt(trimmed);
                } catch (NumberFormatException e) {
                    throw new BusinessException(ErrorCode.BAD_REQUEST, "Valeur entire invalide pour le paramtre " + key + " : " + value);
                }
                if (setting.getMinValue() != null && intVal < setting.getMinValue().intValue()) {
                    throw new BusinessException(ErrorCode.BAD_REQUEST, "La valeur pour " + key + " doit Ǧtre supǸrieure ou Ǹgale  " + setting.getMinValue().intValue());
                }
                if (setting.getMaxValue() != null && intVal > setting.getMaxValue().intValue()) {
                    throw new BusinessException(ErrorCode.BAD_REQUEST, "La valeur pour " + key + " doit Ǧtre infǸrieure ou Ǹgale  " + setting.getMaxValue().intValue());
                }
            }
            case BOOLEAN -> {
                if (!trimmed.equalsIgnoreCase("true") && !trimmed.equalsIgnoreCase("false")) {
                    throw new BusinessException(ErrorCode.BAD_REQUEST, "Valeur boolǸenne invalide pour le paramtre " + key + " : " + value + " (attendu: true ou false)");
                }
            }
            case DECIMAL -> {
                double decVal;
                try {
                    decVal = Double.parseDouble(trimmed);
                } catch (NumberFormatException e) {
                    throw new BusinessException(ErrorCode.BAD_REQUEST, "Valeur dǸcimale invalide pour le paramtre " + key + " : " + value);
                }
                if (setting.getMinValue() != null && decVal < setting.getMinValue()) {
                    throw new BusinessException(ErrorCode.BAD_REQUEST, "La valeur pour " + key + " doit Ǧtre supǸrieure ou Ǹgale  " + setting.getMinValue());
                }
                if (setting.getMaxValue() != null && decVal > setting.getMaxValue()) {
                    throw new BusinessException(ErrorCode.BAD_REQUEST, "La valeur pour " + key + " doit Ǧtre infǸrieure ou Ǹgale  " + setting.getMaxValue());
                }
            }
            case STRING -> {
                if (SettingKeys.CURRENCY_DEFAULT.equals(key)) {
                    if (!ALLOWED_CURRENCIES.contains(trimmed.toUpperCase())) {
                        throw new BusinessException(ErrorCode.BAD_REQUEST, "Devise non autorisǸe : " + value + ". Devises acceptǸes : " + String.join(", ", ALLOWED_CURRENCIES));
                    }
                }
            }
        }
    }

    private String defaultString(String key) {
        return switch (key) {
            case SettingKeys.BOOKING_CANCELLATION_HOURS -> "48";
            case SettingKeys.PAYMENT_EXPIRATION_MINUTES -> "30";
            case SettingKeys.OFFERS_IMAGES_MAX -> "5";
            case SettingKeys.CURRENCY_DEFAULT -> "MAD";
            case SettingKeys.PAYMENT_CASH_ENABLED -> "true";
            case SettingKeys.MAINTENANCE_ENABLED -> "false";
            case SettingKeys.MAINTENANCE_MESSAGE -> "Atlas Voyage est actuellement en maintenance. Nous serons de retour trs bientt.";
            default -> "";
        };
    }

    private int defaultInt(String key) {
        return switch (key) {
            case SettingKeys.BOOKING_CANCELLATION_HOURS -> 48;
            case SettingKeys.PAYMENT_EXPIRATION_MINUTES -> 30;
            case SettingKeys.OFFERS_IMAGES_MAX -> 5;
            default -> 0;
        };
    }
}

