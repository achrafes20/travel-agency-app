package com.agence.voyage.settings;

import com.agence.voyage.dto.SettingBulkUpdateRequest;
import com.agence.voyage.dto.SettingUpdateRequest;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.Setting;
import com.agence.voyage.entity.SettingKeys;
import com.agence.voyage.entity.SettingType;
import com.agence.voyage.entity.User;
import com.agence.voyage.repository.SettingRepository;
import com.agence.voyage.repository.UserRepository;
import com.agence.voyage.security.AppUserDetails;
import com.agence.voyage.service.SettingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:settings_integration_${random.uuid};MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SettingIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private SettingService settingService;

    @Autowired
    private SettingRepository settingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper mapper;

    private User admin;
    private User client;

    private User createUser(String name, Role role) {
        User u = new User(name, "setting-" + UUID.randomUUID() + "@test.ma", "hash", role);
        u.setEmailVerified(true);
        return userRepository.save(u);
    }

    private void seedSetting(String key, String value, SettingType type, String desc, Double min, Double max) {
        settingRepository.findBySettingKey(key).ifPresentOrElse(s -> {
            s.setSettingValue(value);
            settingRepository.save(s);
        }, () -> {
            settingRepository.save(new Setting(key, value, type, desc, min, max, "SYSTEM"));
        });
    }

    @BeforeEach
    void setUp() {
        admin = createUser("Admin Settings", Role.ADMIN);
        client = createUser("Client Settings", Role.CLIENT);

        seedSetting(SettingKeys.BOOKING_CANCELLATION_HOURS, "48", SettingType.INTEGER, "Annulation", 0.0, 720.0);
        seedSetting(SettingKeys.PAYMENT_EXPIRATION_MINUTES, "30", SettingType.INTEGER, "Expiration", 5.0, 1440.0);
        seedSetting(SettingKeys.OFFERS_IMAGES_MAX, "5", SettingType.INTEGER, "Max images", 1.0, 10.0);
        seedSetting(SettingKeys.CURRENCY_DEFAULT, "MAD", SettingType.STRING, "Devise", null, null);
        seedSetting(SettingKeys.PAYMENT_CASH_ENABLED, "true", SettingType.BOOLEAN, "Espèces", null, null);
        seedSetting(SettingKeys.MAINTENANCE_ENABLED, "false", SettingType.BOOLEAN, "Maintenance", null, null);
        seedSetting(SettingKeys.MAINTENANCE_MESSAGE, "Atlas Voyage est actuellement en maintenance.", SettingType.STRING, "Message", null, null);

        settingService.refreshCache();
    }

    @Test
    @DisplayName("L'endpoint public des paramètres est accessible sans authentification et ne filtre que les paramètres autorisés")
    void getPublicSettings_unauthenticatedAllowed() throws Exception {
        mvc.perform(get("/api/settings/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currencyDefault").value("MAD"))
                .andExpect(jsonPath("$.paymentCashEnabled").value(true))
                .andExpect(jsonPath("$.maintenanceEnabled").value(false))
                .andExpect(jsonPath("$.offersImagesMax").value(5));
    }

    @Test
    @DisplayName("L'administrateur peut lire tous les paramètres complets (403 pour CLIENT)")
    void getAllSettings_adminOnly() throws Exception {
        mvc.perform(get("/api/settings")
                        .with(user(new AppUserDetails(admin))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(empty())))
                .andExpect(jsonPath("$[*].settingKey", hasItem("booking.cancellation.hours")));

        mvc.perform(get("/api/settings")
                        .with(user(new AppUserDetails(client))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Mise à jour unitaire valide d'un paramètre avec rafraîchissement immédiat du cache")
    void updateSetting_valid_updatesCache() throws Exception {
        SettingUpdateRequest req = new SettingUpdateRequest("72");

        mvc.perform(put("/api/settings/" + SettingKeys.BOOKING_CANCELLATION_HOURS)
                        .with(user(new AppUserDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.settingValue").value("72"));

        assertEquals(72, settingService.getInt(SettingKeys.BOOKING_CANCELLATION_HOURS));
    }

    @Test
    @DisplayName("Rejet des valeurs invalides : type incorrect, hors bornes, ou devise non supportée")
    void updateSetting_invalid_rejected() throws Exception {
        // Hors bornes max (max 720)
        SettingUpdateRequest outOfBounds = new SettingUpdateRequest("9999");
        mvc.perform(put("/api/settings/" + SettingKeys.BOOKING_CANCELLATION_HOURS)
                        .with(user(new AppUserDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(outOfBounds)))
                .andExpect(status().isBadRequest());

        // Mauvais type pour booléen
        SettingUpdateRequest badBool = new SettingUpdateRequest("not-a-bool");
        mvc.perform(put("/api/settings/" + SettingKeys.PAYMENT_CASH_ENABLED)
                        .with(user(new AppUserDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(badBool)))
                .andExpect(status().isBadRequest());

        // Devise non autorisée (seuls MAD, EUR, USD, GBP sont permis)
        SettingUpdateRequest badCurrency = new SettingUpdateRequest("JPY");
        mvc.perform(put("/api/settings/" + SettingKeys.CURRENCY_DEFAULT)
                        .with(user(new AppUserDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(badCurrency)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Mise à jour en masse atomique (tout-ou-rien) : si un paramètre est invalide, aucun n'est modifié")
    void updateBulk_atomicRollback() throws Exception {
        // req avec 1 valide et 1 invalide
        SettingBulkUpdateRequest bulk = new SettingBulkUpdateRequest(Map.of(
                SettingKeys.BOOKING_CANCELLATION_HOURS, "96",
                SettingKeys.CURRENCY_DEFAULT, "INVALID_CURRENCY"
        ));

        mvc.perform(put("/api/settings")
                        .with(user(new AppUserDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(bulk)))
                .andExpect(status().isBadRequest());

        // Vérifier que le premier paramètre n'a pas été modifié en base
        assertEquals(48, settingService.getInt(SettingKeys.BOOKING_CANCELLATION_HOURS));
    }

    @Test
    @DisplayName("Le filtre de maintenance bloque les requêtes non-admin avec HTTP 503 mais autorise admin et status")
    void maintenanceMode_blocksPublicWith503() throws Exception {
        // Activer la maintenance
        settingService.update(SettingKeys.MAINTENANCE_ENABLED, "true", "ADMIN");

        // Requête cliente sur /api/offers -> 503 Service Unavailable
        mvc.perform(get("/api/offers")
                        .with(user(new AppUserDetails(client))))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value(503))
                .andExpect(jsonPath("$.code").value("MAINTENANCE_MODE"));

        // Requête sur /api/status -> toujours autorisée
        mvc.perform(get("/api/status"))
                .andExpect(status().isOk());

        // Requête sur /api/settings/public -> toujours autorisée
        mvc.perform(get("/api/settings/public"))
                .andExpect(status().isOk());

        // Requête administrateur -> bypass la maintenance
        mvc.perform(get("/api/settings")
                        .with(user(new AppUserDetails(admin))))
                .andExpect(status().isOk());

        // Rétablir la maintenance à false
        settingService.update(SettingKeys.MAINTENANCE_ENABLED, "false", "ADMIN");
    }
}

