package com.agence.voyage.audit;

import com.agence.voyage.entity.AuditAction;
import com.agence.voyage.entity.AuditLog;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.User;
import com.agence.voyage.repository.AuditLogRepository;
import com.agence.voyage.repository.UserRepository;
import com.agence.voyage.security.AppUserDetails;
import com.agence.voyage.service.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:audit_integration_${random.uuid};MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuditIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private AuditService auditService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    private User admin;
    private User client;

    private User createUser(String name, Role role) {
        User u = new User(name, "audit-" + UUID.randomUUID() + "@test.ma", "hash", role);
        u.setEmailVerified(true);
        return userRepository.save(u);
    }

    @BeforeEach
    void setUp() {
        admin = createUser("Admin Audit", Role.ADMIN);
        client = createUser("Client Audit", Role.CLIENT);
    }

    @Test
    @DisplayName("L'entité AuditLog est strictement append-only et immuable")
    void auditLog_isImmutable_throwsOnUpdateOrDelete() {
        AuditLog log = new AuditLog();
        assertThrows(UnsupportedOperationException.class, log::onUpdate);
        assertThrows(UnsupportedOperationException.class, log::onRemove);
    }

    @Test
    @DisplayName("Les données sensibles (mots de passe, tokens) sont masquées dans l'audit")
    void auditLog_masksSensitiveFields() {
        auditService.log(AuditAction.USER_CREATED, "User", 123L, "Création utilisateur",
                null,
                Map.of("email", "test@test.ma", "password", "SuperSecret123!", "token", "jwt-xyz-123"));

        AuditLog saved = auditLogRepository.findAll().stream()
                .filter(l -> "User".equals(l.getResourceType()) && Long.valueOf(123L).equals(l.getResourceId()))
                .findFirst()
                .orElseThrow();

        assertNotNull(saved.getAfterJson());
        assertFalse(saved.getAfterJson().contains("SuperSecret123!"));
        assertFalse(saved.getAfterJson().contains("jwt-xyz-123"));
        assertTrue(saved.getAfterJson().contains("***"));
    }

    @Test
    @DisplayName("L'administrateur peut lister et filtrer les logs d'audit avec pagination")
    void admin_canListAndFilterAuditLogs() throws Exception {
        auditService.log(AuditAction.USER_CREATED, "User", 101L, "Création utilisateur 101", null, null);
        auditService.log(AuditAction.OFFER_MODERATED, "Offer", 202L, "Modération offre 202", null, null);

        // Sans filtre
        mvc.perform(get("/api/audit?page=0&size=10")
                        .with(user(new AppUserDetails(admin))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", not(empty())));

        // Avec filtre action
        mvc.perform(get("/api/audit?action=OFFER_MODERATED")
                        .with(user(new AppUserDetails(admin))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].action", everyItem(is("OFFER_MODERATED"))));

        // Avec filtre resourceType
        mvc.perform(get("/api/audit?resourceType=User")
                        .with(user(new AppUserDetails(admin))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].resourceType", everyItem(is("User"))));
    }

    @Test
    @DisplayName("L'administrateur peut consulter le détail complet d'une entrée d'audit")
    void admin_canGetAuditDetail() throws Exception {
        auditService.log(AuditAction.SETTING_UPDATED, "Setting", 1L, "Mise à jour paramètre",
                Map.of("oldVal", 10), Map.of("newVal", 20));

        AuditLog entry = auditLogRepository.findAll().stream()
                .filter(l -> "Setting".equals(l.getResourceType()))
                .findFirst()
                .orElseThrow();

        mvc.perform(get("/api/audit/" + entry.getId())
                        .with(user(new AppUserDetails(admin))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(entry.getId()))
                .andExpect(jsonPath("$.action").value("SETTING_UPDATED"))
                .andExpect(jsonPath("$.description").value("Mise à jour paramètre"));
    }

    @Test
    @DisplayName("L'export CSV échappe les formules pour contrer l'injection CSV et consigne l'action d'export")
    void exportCsv_escapesFormulasAndLogsExport() throws Exception {
        // Enregistrer une entrée contenant une formule malveillante
        auditService.log("INJECTION_TEST", "Resource", 999L, "=cmd|' /C calc'!A0", null, null);

        MvcResult result = mvc.perform(get("/api/audit/export")
                        .with(user(new AppUserDetails(admin))))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", containsString("text/csv")))
                .andReturn();

        String csv = result.getResponse().getContentAsString();
        // Vérifier l'échappement : la formule commençant par '=' doit être précédée d'une apostrophe
        assertTrue(csv.contains("'=cmd|"));

        // Vérifier que l'export lui-même a créé un log AUDIT_EXPORTED
        boolean exportLogged = auditLogRepository.findAll().stream()
                .anyMatch(l -> "AUDIT_EXPORTED".equals(l.getAction()));
        assertTrue(exportLogged, "L'action d'export doit être enregistrée dans l'audit");
    }

    @Test
    @DisplayName("L'accès au journal d'audit est réservé aux administrateurs (403 pour CLIENT)")
    void nonAdmin_forbidden() throws Exception {
        mvc.perform(get("/api/audit")
                        .with(user(new AppUserDetails(client))))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/audit/export")
                        .with(user(new AppUserDetails(client))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Compatibilité méthode log legacy pour les paiements")
    void legacyPaymentLog_works() {
        auditService.log(admin, "PAYMENT_CAPTURED", 555L, "{\"amount\":100}", "{\"status\":\"PAID\"}");

        AuditLog entry = auditLogRepository.findAll().stream()
                .filter(l -> Long.valueOf(555L).equals(l.getResourceId()))
                .findFirst()
                .orElseThrow();

        assertEquals("PAYMENT", entry.getResourceType());
        assertEquals("PAYMENT_CAPTURED", entry.getAction());
        assertEquals(admin.getEmail(), entry.getActorEmail());
    }
}
