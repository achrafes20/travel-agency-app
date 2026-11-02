package com.agence.voyage.tickets;

import com.agence.voyage.dto.TicketAssigneeUpdateRequest;
import com.agence.voyage.dto.TicketCreateRequest;
import com.agence.voyage.dto.TicketMessageRequest;
import com.agence.voyage.dto.TicketPriorityUpdateRequest;
import com.agence.voyage.dto.TicketStatusUpdateRequest;
import com.agence.voyage.entity.Booking;
import com.agence.voyage.entity.BookingStatus;
import com.agence.voyage.entity.Notification;
import com.agence.voyage.entity.PaymentMethod;
import com.agence.voyage.entity.PaymentStatus;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.Ticket;
import com.agence.voyage.entity.TicketCategory;
import com.agence.voyage.entity.TicketMessage;
import com.agence.voyage.entity.TicketPriority;
import com.agence.voyage.entity.TicketStatus;
import com.agence.voyage.entity.User;
import com.agence.voyage.repository.BookingRepository;
import com.agence.voyage.repository.NotificationRepository;
import com.agence.voyage.repository.TicketMessageRepository;
import com.agence.voyage.repository.TicketRepository;
import com.agence.voyage.repository.UserRepository;
import com.agence.voyage.security.AppUserDetails;
import com.agence.voyage.service.TicketService;
import com.fasterxml.jackson.databind.JsonNode;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.function.Supplier;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.matchesPattern;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:ticket_integration_${random.uuid};MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class TicketIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private TicketService ticketService;

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private TicketMessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ObjectMapper mapper;

    @Autowired
    private PlatformTransactionManager tm;

    private User client;
    private User otherClient;
    private User agent;
    private User otherAgent;
    private User admin;
    private User supplier;

    private <T> T tx(Supplier<T> action) {
        return new TransactionTemplate(tm).execute(s -> action.get());
    }

    private User createAccount(String name, Role role) {
        User u = new User(name, "ticket-" + UUID.randomUUID() + "@test.ma", "hash", role);
        u.setEmailVerified(true);
        return userRepository.save(u);
    }

    private Booking createBooking(User clientUser) {
        Booking b = new Booking();
        b.setReference("BK-TEST-" + UUID.randomUUID().toString().substring(0, 8));
        b.setClient(clientUser);
        b.setStatus(BookingStatus.CONFIRMED);
        b.setPaymentStatus(PaymentStatus.PAID);
        b.setPaymentMethod(PaymentMethod.CARD);
        b.setTotal(new BigDecimal("1200.00"));
        b.setCreatedAt(LocalDateTime.now());
        return bookingRepository.save(b);
    }

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        messageRepository.deleteAll();
        ticketRepository.deleteAll();

        client = createAccount("Sarah Client", Role.CLIENT);
        otherClient = createAccount("Mehdi Client", Role.CLIENT);
        agent = createAccount("Nadia Agent", Role.AGENT);
        otherAgent = createAccount("Karim Agent", Role.AGENT);
        admin = createAccount("Omar Admin", Role.ADMIN);
        supplier = createAccount("Salma Supplier", Role.SUPPLIER);
    }

    // -------------------------------------------------------------------------
    // 1. Création valide par un CLIENT
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("1. Création valide par CLIENT : 201, statut OPEN, format référence, premier message et agents notifiés")
    void clientCreatesValidTicket() throws Exception {
        TicketCreateRequest request = new TicketCreateRequest(
            "Besoin d'aide pour mon vol",
            TicketCategory.BOOKING,
            TicketPriority.HIGH,
            null,
            "Pouvez-vous me confirmer les horaires du vol AT 412 ?",
            null
        );

        MvcResult result = mvc.perform(post("/api/tickets")
                .with(user(new AppUserDetails(client)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.reference", matchesPattern("^TK-[0-9]{4}-[0-9]{6}$")))
            .andExpect(jsonPath("$.subject", is("Besoin d'aide pour mon vol")))
            .andExpect(jsonPath("$.category", is("BOOKING")))
            .andExpect(jsonPath("$.priority", is("HIGH")))
            .andExpect(jsonPath("$.status", is("OPEN")))
            .andExpect(jsonPath("$.requester.id", is(client.getId().intValue())))
            .andExpect(jsonPath("$.requester.fullName", is("Sarah Client")))
            .andExpect(jsonPath("$.messageCount", is(1)))
            .andExpect(jsonPath("$.lastMessagePreview", containsString("Pouvez-vous me confirmer")))
            .andReturn();

        JsonNode root = mapper.readTree(result.getResponse().getContentAsString());
        Long ticketId = root.get("id").asLong();

        // Vérification de la persistance en base
        Ticket ticket = ticketRepository.findById(ticketId).orElseThrow();
        assertEquals(TicketStatus.OPEN, ticket.getStatus());
        assertEquals(client.getId(), ticket.getRequester().getId());

        List<TicketMessage> msgs = messageRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
        assertEquals(1, msgs.size());
        assertEquals("Pouvez-vous me confirmer les horaires du vol AT 412 ?", msgs.get(0).getContent());
        assertFalse(msgs.get(0).isInternalNote());

        // Vérification des notifications créées pour les agents (agent et otherAgent)
        List<Notification> notifs = notificationRepository.findAll();
        List<Notification> agentNotifs = notifs.stream()
            .filter(n -> n.getUser().getId().equals(agent.getId()) || n.getUser().getId().equals(otherAgent.getId()))
            .toList();
        assertTrue(agentNotifs.size() >= 2, "Les agents doivent être notifiés");
        assertFalse(notifs.stream().anyMatch(n -> n.getUser().getId().equals(client.getId())), "Le demandeur ne doit pas être auto-notifié");
    }

    // -------------------------------------------------------------------------
    // 2. Validation des données en entrée
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("2. Validation : sujet vide ou trop court, message vide, catégorie absente renvoient 400")
    void validationErrorsReturn400() throws Exception {
        // Sujet trop court (< 5 caractères)
        TicketCreateRequest shortSubject = new TicketCreateRequest(
            "Test",
            TicketCategory.BOOKING,
            TicketPriority.MEDIUM,
            null,
            "Message valide",
            null
        );
        mvc.perform(post("/api/tickets")
                .with(user(new AppUserDetails(client)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(shortSubject)))
            .andExpect(status().isBadRequest());

        // Message vide
        TicketCreateRequest emptyMessage = new TicketCreateRequest(
            "Sujet valide pour test",
            TicketCategory.BOOKING,
            TicketPriority.MEDIUM,
            null,
            "   ",
            null
        );
        mvc.perform(post("/api/tickets")
                .with(user(new AppUserDetails(client)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(emptyMessage)))
            .andExpect(status().isBadRequest());

        // Catégorie absente (JSON sans category)
        String rawJson = "{\"subject\":\"Sujet valide pour le test\",\"message\":\"Message bien formé\"}";
        mvc.perform(post("/api/tickets")
                .with(user(new AppUserDetails(client)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(rawJson))
            .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------------------
    // 3. Propriété et isolation des utilisateurs
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("3. Propriété : un CLIENT ne peut ni lire, ni commenter, ni changer le statut du ticket d'un autre client (404)")
    void clientCannotAccessOtherClientsTicket() throws Exception {
        // Création d'un ticket par otherClient
        Ticket ticket = ticketService.create(otherClient.getId(), new TicketCreateRequest(
            "Ticket de Mehdi",
            TicketCategory.OTHER,
            TicketPriority.LOW,
            null,
            "Message initial de Mehdi",
            null
        )).messages().get(0).author().id().equals(otherClient.getId())
            ? ticketRepository.findAll().get(0)
            : null;
        assertNotNull(ticket);

        // Sarah tente de lire le ticket de Mehdi -> 404 (pour ne pas révéler l'existence)
        mvc.perform(get("/api/tickets/" + ticket.getId())
                .with(user(new AppUserDetails(client))))
            .andExpect(status().isNotFound());

        // Sarah tente de commenter le ticket de Mehdi -> 404
        mvc.perform(post("/api/tickets/" + ticket.getId() + "/messages")
                .with(user(new AppUserDetails(client)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new TicketMessageRequest("Intrusion", false, null))))
            .andExpect(status().isNotFound());

        // Sarah tente de changer le statut du ticket de Mehdi -> 404
        mvc.perform(patch("/api/tickets/" + ticket.getId() + "/status")
                .with(user(new AppUserDetails(client)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new TicketStatusUpdateRequest(TicketStatus.CLOSED))))
            .andExpect(status().isNotFound());
    }

    // -------------------------------------------------------------------------
    // 4. Confidentialité des notes internes
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("4. Notes internes : un CLIENT ne voit jamais les notes internes dans le détail ni dans le résumé")
    void clientNeverSeesInternalNotes() throws Exception {
        // Création du ticket par Sarah
        var created = ticketService.create(client.getId(), new TicketCreateRequest(
            "Demande avec note interne",
            TicketCategory.PAYMENT,
            TicketPriority.MEDIUM,
            null,
            "Premier message client",
            null
        ));
        Long ticketId = created.id();

        // L'agent ajoute une note interne
        ticketService.addMessage(agent.getId(), ticketId, new TicketMessageRequest(
            "Note confidentielle de l'agent : suspecte un double débit",
            true,
            null
        ));

        // L'agent ajoute une réponse publique
        ticketService.addMessage(agent.getId(), ticketId, new TicketMessageRequest(
            "Bonjour Sarah, nous examinons votre dossier de remboursement.",
            false,
            null
        ));

        // 1. Vue détaillée par Sarah (CLIENT)
        mvc.perform(get("/api/tickets/" + ticketId)
                .with(user(new AppUserDetails(client))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.messages", hasSize(2))) // Seulement 2 messages (le premier et la réponse publique)
            .andExpect(jsonPath("$.messages[0].content", is("Premier message client")))
            .andExpect(jsonPath("$.messages[1].content", is("Bonjour Sarah, nous examinons votre dossier de remboursement.")))
            .andExpect(jsonPath("$.messages[?(@.internalNote == true)]").doesNotExist());

        // 2. Vue détaillée par l'Agent (Staff)
        mvc.perform(get("/api/tickets/" + ticketId)
                .with(user(new AppUserDetails(agent))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.messages", hasSize(3))) // Les 3 messages dont la note interne
            .andExpect(jsonPath("$.messages[1].internalNote", is(true)))
            .andExpect(jsonPath("$.messages[1].content", containsString("Note confidentielle")));

        // 3. Vue liste par Sarah : le messageCount ne compte pas la note interne
        mvc.perform(get("/api/tickets")
                .with(user(new AppUserDetails(client))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].messageCount", is(2)))
            .andExpect(jsonPath("$.content[0].lastMessagePreview", is("Bonjour Sarah, nous examinons votre dossier de remboursement.")));
    }

    // -------------------------------------------------------------------------
    // 5. Périmètre des listes, filtres et pagination
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("5. Liste : CLIENT voit seulement ses tickets ; AGENT/ADMIN voient selon les filtres")
    void listPerimeterAndFilters() throws Exception {
        // Sarah crée 2 tickets
        ticketService.create(client.getId(), new TicketCreateRequest(
            "Ticket Sarah 1", TicketCategory.BOOKING, TicketPriority.LOW, null, "Msg 1", null
        ));
        var t2 = ticketService.create(client.getId(), new TicketCreateRequest(
            "Ticket Sarah 2", TicketCategory.PAYMENT, TicketPriority.URGENT, null, "Msg 2", null
        ));

        // Mehdi crée 1 ticket
        ticketService.create(otherClient.getId(), new TicketCreateRequest(
            "Ticket Mehdi", TicketCategory.OFFER, TicketPriority.MEDIUM, null, "Msg Mehdi", null
        ));

        // Assigner t2 à l'agent
        ticketService.updateAssignee(admin.getId(), t2.id(), new TicketAssigneeUpdateRequest(agent.getId()));

        // Sarah ne voit que ses 2 tickets
        mvc.perform(get("/api/tickets")
                .with(user(new AppUserDetails(client))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements", is(2)));

        // Mehdi ne voit que son unique ticket
        mvc.perform(get("/api/tickets")
                .with(user(new AppUserDetails(otherClient))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements", is(1)));

        // L'agent voit la totalité des tickets (3 tickets)
        mvc.perform(get("/api/tickets")
                .with(user(new AppUserDetails(agent))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements", is(3)));

        // L'agent filtre par "me" (assigné à lui-même) -> 1 ticket
        mvc.perform(get("/api/tickets?assigneeId=me")
                .with(user(new AppUserDetails(agent))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements", is(1)))
            .andExpect(jsonPath("$.content[0].subject", is("Ticket Sarah 2")));

        // L'agent filtre par "unassigned" -> 2 tickets
        mvc.perform(get("/api/tickets?assigneeId=unassigned")
                .with(user(new AppUserDetails(agent))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements", is(2)));

        // Filtre par catégorie PAYMENT -> 1 ticket
        mvc.perform(get("/api/tickets?category=PAYMENT")
                .with(user(new AppUserDetails(admin))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements", is(1)));

        // Recherche textuelle sur le sujet "Mehdi" -> 1 ticket
        mvc.perform(get("/api/tickets?search=Mehdi")
                .with(user(new AppUserDetails(agent))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements", is(1)));
    }

    // -------------------------------------------------------------------------
    // 6. Machine à états, transitions invalides et état CLOSED
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("6. Machine à états : transitions valides, 409 sur transitions invalides, CLOSED est final et bloque les messages")
    void stateMachineTransitionsAndClosedIsFinal() throws Exception {
        var created = ticketService.create(client.getId(), new TicketCreateRequest(
            "Ticket cycle de vie",
            TicketCategory.TECHNICAL,
            TicketPriority.MEDIUM,
            null,
            "Premier message",
            null
        ));
        Long ticketId = created.id();

        // 1. OPEN -> IN_PROGRESS (valide pour AGENT)
        mvc.perform(patch("/api/tickets/" + ticketId + "/status")
                .with(user(new AppUserDetails(agent)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new TicketStatusUpdateRequest(TicketStatus.IN_PROGRESS))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status", is("IN_PROGRESS")));

        // 2. IN_PROGRESS -> CLOSED (invalide selon les règles : IN_PROGRESS ne va que vers RESOLVED ou OPEN)
        mvc.perform(patch("/api/tickets/" + ticketId + "/status")
                .with(user(new AppUserDetails(agent)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new TicketStatusUpdateRequest(TicketStatus.CLOSED))))
            .andExpect(status().isConflict()); // 409

        // 3. IN_PROGRESS -> RESOLVED (valide)
        mvc.perform(patch("/api/tickets/" + ticketId + "/status")
                .with(user(new AppUserDetails(agent)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new TicketStatusUpdateRequest(TicketStatus.RESOLVED))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status", is("RESOLVED")))
            .andExpect(jsonPath("$.resolvedAt").isNotEmpty());

        // 4. RESOLVED -> CLOSED (valide)
        mvc.perform(patch("/api/tickets/" + ticketId + "/status")
                .with(user(new AppUserDetails(agent)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new TicketStatusUpdateRequest(TicketStatus.CLOSED))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status", is("CLOSED")))
            .andExpect(jsonPath("$.closedAt").isNotEmpty());

        // 5. CLOSED -> OPEN (invalide : CLOSED est un état final irréversible)
        mvc.perform(patch("/api/tickets/" + ticketId + "/status")
                .with(user(new AppUserDetails(admin)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new TicketStatusUpdateRequest(TicketStatus.OPEN))))
            .andExpect(status().isConflict()); // 409

        // 6. Envoi de message refusé sur ticket CLOSED -> 409
        mvc.perform(post("/api/tickets/" + ticketId + "/messages")
                .with(user(new AppUserDetails(client)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new TicketMessageRequest("Encore un mot", false, null))))
            .andExpect(status().isConflict());
    }

    // -------------------------------------------------------------------------
    // 7. Transitions automatiques lors d'une réponse
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("7. Transitions automatiques : réponse agent sur OPEN -> IN_PROGRESS ; réponse demandeur sur RESOLVED -> OPEN")
    void automaticTransitionsOnReply() throws Exception {
        var created = ticketService.create(client.getId(), new TicketCreateRequest(
            "Ticket pour transition automatique",
            TicketCategory.BOOKING,
            TicketPriority.MEDIUM,
            null,
            "Question voyage",
            null
        ));
        Long ticketId = created.id();

        // 1. L'agent répond alors que le ticket est OPEN -> passage automatique en IN_PROGRESS
        mvc.perform(post("/api/tickets/" + ticketId + "/messages")
                .with(user(new AppUserDetails(agent)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new TicketMessageRequest("Je prends en charge votre demande.", false, null))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status", is("IN_PROGRESS")));

        // L'agent résout le ticket
        ticketService.updateStatus(agent.getId(), ticketId, new TicketStatusUpdateRequest(TicketStatus.RESOLVED));

        // 2. Le client répond alors que le ticket est RESOLVED -> réouverture automatique en OPEN
        mvc.perform(post("/api/tickets/" + ticketId + "/messages")
                .with(user(new AppUserDetails(client)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new TicketMessageRequest("En réalité j'ai encore une question.", false, null))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status", is("OPEN")))
            .andExpect(jsonPath("$.resolvedAt").doesNotExist());
    }

    // -------------------------------------------------------------------------
    // 8. Permissions de changement de statut par le demandeur
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("8. Permissions statut : CLIENT ne peut pas passer en IN_PROGRESS/RESOLVED ; peut fermer et rouvrir")
    void clientStatusPermissions() throws Exception {
        var created = ticketService.create(client.getId(), new TicketCreateRequest(
            "Ticket permission statut",
            TicketCategory.ACCOUNT,
            TicketPriority.LOW,
            null,
            "Problème mot de passe",
            null
        ));
        Long ticketId = created.id();

        // CLIENT tente de passer en IN_PROGRESS -> 403 Forbidden
        mvc.perform(patch("/api/tickets/" + ticketId + "/status")
                .with(user(new AppUserDetails(client)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new TicketStatusUpdateRequest(TicketStatus.IN_PROGRESS))))
            .andExpect(status().isForbidden());

        // CLIENT tente de passer en RESOLVED -> 403 Forbidden
        mvc.perform(patch("/api/tickets/" + ticketId + "/status")
                .with(user(new AppUserDetails(client)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new TicketStatusUpdateRequest(TicketStatus.RESOLVED))))
            .andExpect(status().isForbidden());

        // CLIENT ferme son ticket depuis OPEN -> Autorisé (200)
        mvc.perform(patch("/api/tickets/" + ticketId + "/status")
                .with(user(new AppUserDetails(client)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new TicketStatusUpdateRequest(TicketStatus.CLOSED))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status", is("CLOSED")));

        // Nouveau ticket pour tester la réouverture depuis RESOLVED
        var t2 = ticketService.create(client.getId(), new TicketCreateRequest(
            "Ticket pour réouverture",
            TicketCategory.ACCOUNT,
            TicketPriority.LOW,
            null,
            "Message",
            null
        ));
        ticketService.updateStatus(agent.getId(), t2.id(), new TicketStatusUpdateRequest(TicketStatus.RESOLVED));

        // CLIENT rouvre son ticket depuis RESOLVED -> Autorisé (200)
        mvc.perform(patch("/api/tickets/" + t2.id() + "/status")
                .with(user(new AppUserDetails(client)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new TicketStatusUpdateRequest(TicketStatus.OPEN))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status", is("OPEN")));
    }

    // -------------------------------------------------------------------------
    // 9. Assignation et permissions associées
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("9. Assignation : CLIENT interdit (403), AGENT auto-assigne seulement, ADMIN assigne n'importe quel staff, assigner un client refusé (400)")
    void assignmentRules() throws Exception {
        var created = ticketService.create(client.getId(), new TicketCreateRequest(
            "Ticket pour assignation",
            TicketCategory.TECHNICAL,
            TicketPriority.MEDIUM,
            null,
            "Bug affichage",
            null
        ));
        Long ticketId = created.id();

        // 1. CLIENT tente d'assigner -> 403 Forbidden
        mvc.perform(patch("/api/tickets/" + ticketId + "/assignee")
                .with(user(new AppUserDetails(client)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new TicketAssigneeUpdateRequest(agent.getId()))))
            .andExpect(status().isForbidden());

        // 2. AGENT tente d'assigner un autre agent -> 403 Forbidden
        mvc.perform(patch("/api/tickets/" + ticketId + "/assignee")
                .with(user(new AppUserDetails(agent)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new TicketAssigneeUpdateRequest(otherAgent.getId()))))
            .andExpect(status().isForbidden());

        // 3. AGENT s'auto-assigne -> Succès (200)
        mvc.perform(patch("/api/tickets/" + ticketId + "/assignee")
                .with(user(new AppUserDetails(agent)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new TicketAssigneeUpdateRequest(agent.getId()))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.assignee.id", is(agent.getId().intValue())));

        // 4. ADMIN assigne un autre agent -> Succès (200)
        mvc.perform(patch("/api/tickets/" + ticketId + "/assignee")
                .with(user(new AppUserDetails(admin)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new TicketAssigneeUpdateRequest(otherAgent.getId()))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.assignee.id", is(otherAgent.getId().intValue())));

        // 5. Tentative d'assigner un CLIENT -> 400 Bad Request
        mvc.perform(patch("/api/tickets/" + ticketId + "/assignee")
                .with(user(new AppUserDetails(admin)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new TicketAssigneeUpdateRequest(client.getId()))))
            .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------------------
    // 10. Notifications et ciblage précis
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("10. Notifications : bonnes cibles, aucune auto-notification, aucune note interne au demandeur")
    void notificationTargetingRules() throws Exception {
        notificationRepository.deleteAll();

        // 1. Création par Sarah -> tous les agents notifiés, Sarah NON
        var created = ticketService.create(client.getId(), new TicketCreateRequest(
            "Sujet notifs", TicketCategory.BOOKING, TicketPriority.HIGH, null, "Premier msg", null
        ));
        Long ticketId = created.id();

        List<Notification> initialNotifs = notificationRepository.findAll();
        assertTrue(initialNotifs.stream().anyMatch(n -> n.getUser().getId().equals(agent.getId())));
        assertTrue(initialNotifs.stream().anyMatch(n -> n.getUser().getId().equals(otherAgent.getId())));
        assertFalse(initialNotifs.stream().anyMatch(n -> n.getUser().getId().equals(client.getId())), "Sarah ne doit pas être notifiée");

        notificationRepository.deleteAll();

        // 2. Note interne par l'agent -> Sarah ne doit PAS être notifiée
        ticketService.addMessage(agent.getId(), ticketId, new TicketMessageRequest(
            "Note interne confidentielle", true, null
        ));
        assertEquals(0, notificationRepository.count(), "Une note interne ne génère aucune notification pour le demandeur");

        // 3. Réponse publique de l'agent -> Sarah est notifiée, l'agent NON
        ticketService.addMessage(agent.getId(), ticketId, new TicketMessageRequest(
            "Réponse publique de l'agent", false, null
        ));
        List<Notification> afterReplyNotifs = notificationRepository.findAll();
        assertEquals(1, afterReplyNotifs.size());
        assertEquals(client.getId(), afterReplyNotifs.get(0).getUser().getId());

        notificationRepository.deleteAll();

        // Assigner le ticket à Nadia
        ticketService.updateAssignee(admin.getId(), ticketId, new TicketAssigneeUpdateRequest(agent.getId()));
        notificationRepository.deleteAll();

        // 4. Sarah répond -> l'agent assigné (Nadia) est notifié
        ticketService.addMessage(client.getId(), ticketId, new TicketMessageRequest(
            "Merci pour l'information", false, null
        ));
        List<Notification> clientReplyNotifs = notificationRepository.findAll();
        assertEquals(1, clientReplyNotifs.size());
        assertEquals(agent.getId(), clientReplyNotifs.get(0).getUser().getId(), "L'agent assigné doit recevoir la notification");
    }

    // -------------------------------------------------------------------------
    // 11. Suppression réservée à ADMIN
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("11. Suppression : ADMIN seulement (204) ; AGENT et CLIENT refusés (403)")
    void deletionRestrictedToAdmin() throws Exception {
        var created = ticketService.create(client.getId(), new TicketCreateRequest(
            "Ticket à supprimer", TicketCategory.OTHER, TicketPriority.LOW, null, "Msg", null
        ));
        Long ticketId = created.id();

        // CLIENT tente de supprimer -> 403 Forbidden
        mvc.perform(delete("/api/tickets/" + ticketId)
                .with(user(new AppUserDetails(client))))
            .andExpect(status().isForbidden());

        // AGENT tente de supprimer -> 403 Forbidden
        mvc.perform(delete("/api/tickets/" + ticketId)
                .with(user(new AppUserDetails(agent))))
            .andExpect(status().isForbidden());

        // ADMIN supprime -> 204 No Content
        mvc.perform(delete("/api/tickets/" + ticketId)
                .with(user(new AppUserDetails(admin))))
            .andExpect(status().isNoContent());

        assertFalse(ticketRepository.existsById(ticketId));
    }

    // -------------------------------------------------------------------------
    // 12. Sécurité : authentification et contrôle des rôles
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("12. Sécurité : requête sans token -> 401 ; mauvais rôle sur endpoint restreint -> 403")
    void securityTokenAndRoleEnforcement() throws Exception {
        // Sans authentification sur GET /api/tickets -> 401 Unauthorized
        mvc.perform(get("/api/tickets"))
            .andExpect(status().isUnauthorized());

        // CLIENT tente de changer la priorité -> 403 Forbidden
        var created = ticketService.create(client.getId(), new TicketCreateRequest(
            "Ticket test sécurité", TicketCategory.TECHNICAL, TicketPriority.LOW, null, "Msg", null
        ));
        mvc.perform(patch("/api/tickets/" + created.id() + "/priority")
                .with(user(new AppUserDetails(client)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new TicketPriorityUpdateRequest(TicketPriority.URGENT))))
            .andExpect(status().isForbidden());

        // CLIENT tente d'accéder aux statistiques globales -> 403 Forbidden
        mvc.perform(get("/api/tickets/stats")
                .with(user(new AppUserDetails(client))))
            .andExpect(status().isForbidden());
    }

    // -------------------------------------------------------------------------
    // 13. Réservation liée et vérification de propriété
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("13. Réservation liée : valide si appartient au demandeur, refusée (400) si appartient à un autre")
    void linkedBookingValidation() throws Exception {
        Booking bookingSarah = createBooking(client);
        Booking bookingMehdi = createBooking(otherClient);

        // Sarah lie SA réservation -> Succès 201
        TicketCreateRequest validRequest = new TicketCreateRequest(
            "Question sur ma réservation",
            TicketCategory.BOOKING,
            TicketPriority.MEDIUM,
            bookingSarah.getId(),
            "Tout est en ordre pour mon départ ?",
            null
        );
        mvc.perform(post("/api/tickets")
                .with(user(new AppUserDetails(client)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(validRequest)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.booking.id", is(bookingSarah.getId().intValue())))
            .andExpect(jsonPath("$.booking.reference", is(bookingSarah.getReference())));

        // Sarah tente de lier la réservation de Mehdi -> 400 Bad Request
        TicketCreateRequest invalidRequest = new TicketCreateRequest(
            "Tentative avec réservation d'autrui",
            TicketCategory.BOOKING,
            TicketPriority.MEDIUM,
            bookingMehdi.getId(),
            "Question illégitime",
            null
        );
        mvc.perform(post("/api/tickets")
                .with(user(new AppUserDetails(client)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(invalidRequest)))
            .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------------------
    // 14. Statistiques des tickets (GET /api/tickets/stats)
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("14. Statistiques : compteurs par statut et priorité pour les tableaux de bord Staff")
    void ticketStatsEndpoint() throws Exception {
        ticketService.create(client.getId(), new TicketCreateRequest(
            "Ticket 1", TicketCategory.BOOKING, TicketPriority.LOW, null, "Msg 1", null
        ));
        var t2 = ticketService.create(client.getId(), new TicketCreateRequest(
            "Ticket 2", TicketCategory.PAYMENT, TicketPriority.HIGH, null, "Msg 2", null
        ));
        ticketService.updateStatus(agent.getId(), t2.id(), new TicketStatusUpdateRequest(TicketStatus.IN_PROGRESS));

        var t3 = ticketService.create(client.getId(), new TicketCreateRequest(
            "Ticket 3", TicketCategory.OTHER, TicketPriority.URGENT, null, "Msg 3", null
        ));
        ticketService.updateStatus(agent.getId(), t3.id(), new TicketStatusUpdateRequest(TicketStatus.RESOLVED));

        mvc.perform(get("/api/tickets/stats")
                .with(user(new AppUserDetails(agent))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.total", is(3)))
            .andExpect(jsonPath("$.open", is(1)))
            .andExpect(jsonPath("$.inProgress", is(1)))
            .andExpect(jsonPath("$.resolved", is(1)))
            .andExpect(jsonPath("$.closed", is(0)))
            .andExpect(jsonPath("$.lowPriority", is(1)))
            .andExpect(jsonPath("$.highPriority", is(1)))
            .andExpect(jsonPath("$.urgentPriority", is(1)));
    }
}

