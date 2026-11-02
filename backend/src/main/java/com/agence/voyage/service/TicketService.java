package com.agence.voyage.service;

import com.agence.voyage.dto.PageResponse;
import com.agence.voyage.dto.TicketAssigneeUpdateRequest;
import com.agence.voyage.dto.TicketAttachmentDto;
import com.agence.voyage.dto.TicketCreateRequest;
import com.agence.voyage.dto.TicketMessageRequest;
import com.agence.voyage.dto.TicketMessageResponse;
import com.agence.voyage.dto.TicketPriorityUpdateRequest;
import com.agence.voyage.dto.TicketResponse;
import com.agence.voyage.dto.TicketStatsResponse;
import com.agence.voyage.dto.TicketStatusUpdateRequest;
import com.agence.voyage.entity.Booking;
import com.agence.voyage.entity.NotificationType;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.Ticket;
import com.agence.voyage.entity.TicketAttachment;
import com.agence.voyage.entity.TicketCategory;
import com.agence.voyage.entity.TicketMessage;
import com.agence.voyage.entity.TicketPriority;
import com.agence.voyage.entity.TicketSequence;
import com.agence.voyage.entity.TicketStatus;
import com.agence.voyage.entity.User;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.exception.ErrorCode;
import com.agence.voyage.exception.ForbiddenException;
import com.agence.voyage.repository.BookingRepository;
import com.agence.voyage.repository.TicketAttachmentRepository;
import com.agence.voyage.repository.TicketMessageRepository;
import com.agence.voyage.repository.TicketRepository;
import com.agence.voyage.repository.TicketSequenceRepository;
import com.agence.voyage.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
public class TicketService {

    private static final Logger log = LoggerFactory.getLogger(TicketService.class);

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
        "id", "reference", "subject", "createdAt", "updatedAt", "status", "priority"
    );

    private final TicketRepository tickets;
    private final TicketMessageRepository messages;
    private final TicketAttachmentRepository attachments;
    private final TicketSequenceRepository sequences;
    private final UserRepository users;
    private final BookingRepository bookings;
    private final NotificationService notifications;
    private final JdbcTemplate jdbc;
    private final Clock clock;

    public TicketService(TicketRepository tickets,
                         TicketMessageRepository messages,
                         TicketAttachmentRepository attachments,
                         TicketSequenceRepository sequences,
                         UserRepository users,
                         BookingRepository bookings,
                         NotificationService notifications,
                         JdbcTemplate jdbc,
                         Clock clock) {
        this.tickets = tickets;
        this.messages = messages;
        this.attachments = attachments;
        this.sequences = sequences;
        this.users = users;
        this.bookings = bookings;
        this.notifications = notifications;
        this.jdbc = jdbc;
        this.clock = clock;
    }

    private LocalDateTime now() {
        return LocalDateTime.now(clock);
    }

    private User actor(Long actorId) {
        return users.findById(actorId).orElseThrow(() ->
            new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
    }

    private BusinessException notFound() {
        return new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Ticket introuvable");
    }

    /**
     * Génération concurrente et atomique de la référence au format TK-YYYY-XXXXXX.
     */
    private String nextReference() {
        int year = now().getYear();
        jdbc.update("INSERT INTO ticket_sequence(sequence_year, last_value) VALUES (?, 0) " +
                    "ON DUPLICATE KEY UPDATE sequence_year = sequence_year", year);
        TicketSequence sequence = sequences.lockYear(year).orElseThrow();
        long next = sequence.getLastValue() + 1;
        if (next > 999999) {
            throw new BusinessException(ErrorCode.CONFLICT, HttpStatus.CONFLICT, "Séquence annuelle de tickets épuisée");
        }
        sequence.setLastValue(next);
        return String.format(Locale.ROOT, "TK-%d-%06d", year, next);
    }

    /**
     * Création d'un ticket par un CLIENT ou un SUPPLIER avec son premier message.
     */
    @Transactional
    public TicketResponse create(Long actorId, TicketCreateRequest request) {
        User requester = actor(actorId);
        if (requester.getRole() != Role.CLIENT && requester.getRole() != Role.SUPPLIER) {
            throw new ForbiddenException("Seuls les clients et fournisseurs peuvent ouvrir un ticket de support");
        }

        Booking booking = null;
        if (request.bookingId() != null) {
            booking = bookings.findById(request.bookingId()).orElseThrow(() ->
                new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Réservation introuvable"));
            validateBookingOwnership(requester, booking);
        }

        String reference = nextReference();
        Ticket ticket = new Ticket();
        ticket.setReference(reference);
        ticket.setSubject(request.subject().trim());
        ticket.setCategory(request.category());
        ticket.setPriority(request.effectivePriority());
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setRequester(requester);
        ticket.setAssignee(null);
        ticket.setBooking(booking);
        ticket.setCreatedAt(now());
        ticket.setUpdatedAt(now());

        TicketMessage firstMessage = new TicketMessage();
        firstMessage.setTicket(ticket);
        firstMessage.setAuthor(requester);
        firstMessage.setContent(request.message().trim());
        firstMessage.setInternalNote(false);
        firstMessage.setCreatedAt(now());

        if (request.attachments() != null && !request.attachments().isEmpty()) {
            if (request.attachments().size() > 3) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Un maximum de 3 pièces jointes est autorisé par message");
            }
            for (TicketAttachmentDto attDto : request.attachments()) {
                TicketAttachment attachment = new TicketAttachment(
                    firstMessage,
                    attDto.name(),
                    attDto.url(),
                    attDto.mimeType(),
                    attDto.size()
                );
                firstMessage.addAttachment(attachment);
            }
        }

        ticket.addMessage(firstMessage);
        Ticket saved = tickets.save(ticket);

        // Notifier tous les agents du nouveau ticket
        List<User> agents = users.findByRoleAndArchivedFalse(Role.AGENT);
        for (User agent : agents) {
            sendNotification(agent, requester, NotificationType.TICKET_REPLY,
                "Nouveau ticket : " + saved.getReference(),
                saved.getSubject() + " (par " + requester.getFullName() + ")",
                "/agent/index.html?page=tickets&id=" + saved.getId());
        }

        TicketMessageResponse msgResp = TicketMessageResponse.from(firstMessage);
        return TicketResponse.from(saved, 1, firstMessage.getContent(), firstMessage.getCreatedAt(), List.of(msgResp));
    }

    /**
     * Consultation paginée et filtrée des tickets.
     */
    @Transactional(readOnly = true)
    public PageResponse<TicketResponse> list(Long actorId,
                                            TicketStatus status,
                                            TicketPriority priority,
                                            TicketCategory category,
                                            String assigneeFilter,
                                            String search,
                                            int page,
                                            int size,
                                            String sortParam) {
        User current = actor(actorId);
        int pageSize = PaginationSupport.size(size);
        int pageNumber = PaginationSupport.page(page);
        String normalizedSort = PaginationSupport.sort(sortParam == null ? "createdAt,desc" : sortParam, ALLOWED_SORT_FIELDS);
        String[] sortParts = normalizedSort.split(",");
        Sort sort = Sort.by(Sort.Direction.fromString(sortParts[1]), sortParts[0]).and(Sort.by("id"));

        Specification<Ticket> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Règle de propriété : CLIENT et SUPPLIER ne voient que leurs propres tickets
            if (current.getRole() == Role.CLIENT || current.getRole() == Role.SUPPLIER) {
                predicates.add(cb.equal(root.get("requester").get("id"), current.getId()));
            } else if (assigneeFilter != null && !assigneeFilter.isBlank()) {
                if ("me".equalsIgnoreCase(assigneeFilter)) {
                    predicates.add(cb.equal(root.get("assignee").get("id"), current.getId()));
                } else if ("unassigned".equalsIgnoreCase(assigneeFilter)) {
                    predicates.add(cb.isNull(root.get("assignee")));
                } else {
                    try {
                        Long targetAssigneeId = Long.parseLong(assigneeFilter.trim());
                        predicates.add(cb.equal(root.get("assignee").get("id"), targetAssigneeId));
                    } catch (NumberFormatException ignored) {
                    }
                }
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }
            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }
            if (search != null && !search.isBlank()) {
                String term = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("reference")), term),
                    cb.like(cb.lower(root.get("subject")), term)
                ));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };

        Page<Ticket> ticketPage = tickets.findAll(spec, PageRequest.of(pageNumber, pageSize, sort));

        if (ticketPage.isEmpty()) {
            return new PageResponse<>(Collections.emptyList(), pageNumber, pageSize, 0, normalizedSort);
        }

        List<Long> ticketIds = ticketPage.getContent().stream().map(Ticket::getId).toList();
        List<TicketMessage> allMessages = messages.findByTicketIdInOrderByCreatedAtAsc(ticketIds);
        Map<Long, List<TicketMessage>> grouped = new HashMap<>();
        for (TicketMessage msg : allMessages) {
            grouped.computeIfAbsent(msg.getTicket().getId(), k -> new ArrayList<>()).add(msg);
        }

        boolean isStaff = current.getRole() == Role.AGENT || current.getRole() == Role.ADMIN;
        List<TicketResponse> responses = ticketPage.getContent().stream().map(t -> {
            List<TicketMessage> msgs = grouped.getOrDefault(t.getId(), Collections.emptyList());
            List<TicketMessage> visible = isStaff ? msgs : msgs.stream().filter(m -> !m.isInternalNote()).toList();
            int count = visible.size();
            TicketMessage last = visible.isEmpty() ? null : visible.get(visible.size() - 1);
            String preview = last != null ? last.getContent() : "";
            LocalDateTime lastAt = last != null ? last.getCreatedAt() : t.getCreatedAt();
            return TicketResponse.from(t, count, preview, lastAt, Collections.emptyList());
        }).toList();

        return new PageResponse<>(responses, pageNumber, pageSize, ticketPage.getTotalElements(), normalizedSort);
    }

    /**
     * Consultation détaillée d'un ticket avec filtrage des notes internes selon le rôle.
     */
    @Transactional(readOnly = true)
    public TicketResponse get(Long actorId, Long ticketId) {
        User current = actor(actorId);
        Ticket ticket = tickets.findWithDetailsById(ticketId).orElseThrow(this::notFound);

        boolean isStaff = current.getRole() == Role.AGENT || current.getRole() == Role.ADMIN;
        if (!isStaff && !ticket.getRequester().getId().equals(current.getId())) {
            throw notFound();
        }

        List<TicketMessage> allMessages = messages.findByTicketIdOrderByCreatedAtAsc(ticketId);
        List<TicketMessage> visible = isStaff ? allMessages : allMessages.stream().filter(m -> !m.isInternalNote()).toList();

        int count = visible.size();
        TicketMessage last = visible.isEmpty() ? null : visible.get(visible.size() - 1);
        String preview = last != null ? last.getContent() : "";
        LocalDateTime lastAt = last != null ? last.getCreatedAt() : ticket.getCreatedAt();

        List<TicketMessageResponse> messageResponses = visible.stream()
            .map(TicketMessageResponse::from)
            .toList();

        return TicketResponse.from(ticket, count, preview, lastAt, messageResponses);
    }

    /**
     * Ajout d'un message à un ticket avec machine à états automatique et notifications.
     */
    @Transactional
    public TicketResponse addMessage(Long actorId, Long ticketId, TicketMessageRequest request) {
        User current = actor(actorId);
        Ticket ticket = tickets.lockById(ticketId).orElseThrow(this::notFound);

        boolean isStaff = current.getRole() == Role.AGENT || current.getRole() == Role.ADMIN;
        if (!isStaff && !ticket.getRequester().getId().equals(current.getId())) {
            throw notFound();
        }

        if (ticket.getStatus() == TicketStatus.CLOSED) {
            throw new BusinessException(ErrorCode.INVALID_STATE_TRANSITION, HttpStatus.CONFLICT,
                "Le ticket est fermé et n'accepte plus de messages");
        }

        boolean isInternalNote = isStaff && request.effectiveInternalNote();

        TicketMessage msg = new TicketMessage();
        msg.setTicket(ticket);
        msg.setAuthor(current);
        msg.setContent(request.content().trim());
        msg.setInternalNote(isInternalNote);
        msg.setCreatedAt(now());

        if (request.attachments() != null && !request.attachments().isEmpty()) {
            if (request.attachments().size() > 3) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Un maximum de 3 pièces jointes est autorisé par message");
            }
            for (TicketAttachmentDto attDto : request.attachments()) {
                TicketAttachment attachment = new TicketAttachment(
                    msg,
                    attDto.name(),
                    attDto.url(),
                    attDto.mimeType(),
                    attDto.size()
                );
                msg.addAttachment(attachment);
            }
        }

        messages.save(msg);
        ticket.setUpdatedAt(now());

        // Transitions automatiques :
        // 1. Réponse agent/admin sur ticket OPEN -> IN_PROGRESS
        if (isStaff && ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }
        // 2. Réponse du demandeur sur ticket RESOLVED -> réouverture en OPEN
        if (!isStaff && ticket.getStatus() == TicketStatus.RESOLVED) {
            ticket.setStatus(TicketStatus.OPEN);
            ticket.setResolvedAt(null);
        }

        Ticket savedTicket = tickets.save(ticket);

        // Notifications :
        if (isStaff) {
            // Un agent répond : notifier le demandeur UNIQUEMENT s'il ne s'agit PAS d'une note interne
            if (!isInternalNote) {
                sendNotification(ticket.getRequester(), current, NotificationType.TICKET_REPLY,
                    "Nouvelle réponse : " + ticket.getReference(),
                    cut(msg.getContent(), 200),
                    "/client/index.html?page=tickets&id=" + ticket.getId());
            }
        } else {
            // Le demandeur répond : notifier l'assigné ou, s'il n'y en a pas, tous les agents
            if (ticket.getAssignee() != null) {
                sendNotification(ticket.getAssignee(), current, NotificationType.TICKET_REPLY,
                    "Nouveau message : " + ticket.getReference(),
                    ticket.getSubject() + " : " + cut(msg.getContent(), 200),
                    "/agent/index.html?page=tickets&id=" + ticket.getId());
            } else {
                List<User> agents = users.findByRoleAndArchivedFalse(Role.AGENT);
                for (User agent : agents) {
                    sendNotification(agent, current, NotificationType.TICKET_REPLY,
                        "Nouveau message : " + ticket.getReference(),
                        ticket.getSubject() + " : " + cut(msg.getContent(), 200),
                        "/agent/index.html?page=tickets&id=" + ticket.getId());
                }
            }
        }

        return get(actorId, savedTicket.getId());
    }

    /**
     * Changement de statut selon la machine à états et les permissions du rôle.
     */
    @Transactional
    public TicketResponse updateStatus(Long actorId, Long ticketId, TicketStatusUpdateRequest request) {
        User current = actor(actorId);
        Ticket ticket = tickets.lockById(ticketId).orElseThrow(this::notFound);

        boolean isStaff = current.getRole() == Role.AGENT || current.getRole() == Role.ADMIN;
        if (!isStaff && !ticket.getRequester().getId().equals(current.getId())) {
            throw notFound();
        }

        TicketStatus from = ticket.getStatus();
        TicketStatus to = request.status();

        if (from == to) {
            return get(actorId, ticketId);
        }

        // Vérification de la machine à états globale
        validateStateMachineTransition(from, to);

        // Vérification des permissions par rôle
        if (!isStaff) {
            // Demandeur (CLIENT ou SUPPLIER) :
            // Peut seulement :
            // - fermer son propre ticket (CLOSED depuis OPEN ou RESOLVED)
            // - rouvrir un ticket RESOLVED (OPEN)
            boolean allowedForClient = (to == TicketStatus.CLOSED && (from == TicketStatus.OPEN || from == TicketStatus.RESOLVED))
                || (to == TicketStatus.OPEN && from == TicketStatus.RESOLVED);
            if (!allowedForClient) {
                throw new ForbiddenException("Vous n'êtes pas autorisé à effectuer cette transition de statut");
            }
        }

        ticket.setStatus(to);
        ticket.setUpdatedAt(now());

        if (to == TicketStatus.RESOLVED) {
            ticket.setResolvedAt(now());
        } else if (to == TicketStatus.CLOSED) {
            ticket.setClosedAt(now());
        } else if (to == TicketStatus.OPEN) {
            ticket.setResolvedAt(null);
            ticket.setClosedAt(null);
        }

        Ticket saved = tickets.save(ticket);

        // Notification si changement opéré par agent/admin vers le demandeur
        if (isStaff) {
            sendNotification(ticket.getRequester(), current, NotificationType.TICKET_REPLY,
                "Statut de votre ticket : " + ticket.getReference(),
                "Votre ticket est maintenant « " + to + " ».",
                "/client/index.html?page=tickets&id=" + ticket.getId());
        }

        return get(actorId, saved.getId());
    }

    /**
     * Assignation du ticket : AGENT s'auto-assigne, ADMIN assigne n'importe quel AGENT/ADMIN.
     */
    @Transactional
    public TicketResponse updateAssignee(Long actorId, Long ticketId, TicketAssigneeUpdateRequest request) {
        User current = actor(actorId);
        if (current.getRole() != Role.AGENT && current.getRole() != Role.ADMIN) {
            throw new ForbiddenException("L'assignation est réservée aux agents et administrateurs");
        }

        Ticket ticket = tickets.lockById(ticketId).orElseThrow(this::notFound);
        User newAssignee = null;

        if (request.assigneeId() != null) {
            newAssignee = users.findById(request.assigneeId()).orElseThrow(() ->
                new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

            if (newAssignee.getRole() != Role.AGENT && newAssignee.getRole() != Role.ADMIN) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "L'assigné doit être un agent ou un administrateur");
            }

            if (current.getRole() == Role.AGENT && !newAssignee.getId().equals(current.getId())) {
                throw new ForbiddenException("Un agent ne peut s'assigner un ticket qu'à lui-même");
            }
        } else {
            // Désassignation : autorisée uniquement pour ADMIN
            if (current.getRole() != Role.ADMIN) {
                throw new ForbiddenException("Seul un administrateur peut retirer l'assignation d'un ticket");
            }
        }

        ticket.setAssignee(newAssignee);
        ticket.setUpdatedAt(now());
        Ticket saved = tickets.save(ticket);

        // Notifier l'agent assigné (sauf auto-assignation)
        if (newAssignee != null && !newAssignee.getId().equals(current.getId())) {
            sendNotification(newAssignee, current, NotificationType.TICKET_REPLY,
                "Ticket assigné : " + ticket.getReference(),
                "Le ticket « " + ticket.getSubject() + " » vous a été assigné.",
                "/agent/index.html?page=tickets&id=" + ticket.getId());
        }

        return get(actorId, saved.getId());
    }

    /**
     * Modification de la priorité (AGENT ou ADMIN).
     */
    @Transactional
    public TicketResponse updatePriority(Long actorId, Long ticketId, TicketPriorityUpdateRequest request) {
        User current = actor(actorId);
        if (current.getRole() != Role.AGENT && current.getRole() != Role.ADMIN) {
            throw new ForbiddenException("La modification de priorité est réservée aux agents et administrateurs");
        }

        Ticket ticket = tickets.lockById(ticketId).orElseThrow(this::notFound);
        ticket.setPriority(request.priority());
        ticket.setUpdatedAt(now());
        Ticket saved = tickets.save(ticket);

        return get(actorId, saved.getId());
    }

    /**
     * Suppression définitive du ticket (ADMIN uniquement).
     */
    @Transactional
    public void delete(Long actorId, Long ticketId) {
        User current = actor(actorId);
        if (current.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Seul un administrateur peut supprimer un ticket");
        }

        Ticket ticket = tickets.findById(ticketId).orElseThrow(this::notFound);
        tickets.delete(ticket);
    }

    /**
     * Compteurs statistiques par statut et priorité (AGENT ou ADMIN).
     */
    @Transactional(readOnly = true)
    public TicketStatsResponse getStats(Long actorId) {
        User current = actor(actorId);
        if (current.getRole() != Role.AGENT && current.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Statistiques réservées aux agents et administrateurs");
        }

        long open = tickets.countByStatus(TicketStatus.OPEN);
        long inProgress = tickets.countByStatus(TicketStatus.IN_PROGRESS);
        long resolved = tickets.countByStatus(TicketStatus.RESOLVED);
        long closed = tickets.countByStatus(TicketStatus.CLOSED);
        long total = open + inProgress + resolved + closed;

        long low = tickets.countByPriority(TicketPriority.LOW);
        long medium = tickets.countByPriority(TicketPriority.MEDIUM);
        long high = tickets.countByPriority(TicketPriority.HIGH);
        long urgent = tickets.countByPriority(TicketPriority.URGENT);

        return new TicketStatsResponse(total, open, inProgress, resolved, closed, low, medium, high, urgent);
    }

    private void validateStateMachineTransition(TicketStatus from, TicketStatus to) {
        boolean valid = switch (from) {
            case OPEN -> to == TicketStatus.IN_PROGRESS || to == TicketStatus.RESOLVED || to == TicketStatus.CLOSED;
            case IN_PROGRESS -> to == TicketStatus.RESOLVED || to == TicketStatus.OPEN;
            case RESOLVED -> to == TicketStatus.CLOSED || to == TicketStatus.OPEN;
            case CLOSED -> false;
        };

        if (!valid) {
            throw new BusinessException(ErrorCode.INVALID_STATE_TRANSITION, HttpStatus.CONFLICT,
                "Transition de statut invalide : impossible de passer de " + from + " à " + to);
        }
    }

    private void validateBookingOwnership(User requester, Booking booking) {
        if (requester.getRole() == Role.CLIENT) {
            if (!booking.getClient().getId().equals(requester.getId())) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Cette réservation n'appartient pas au demandeur");
            }
        } else if (requester.getRole() == Role.SUPPLIER) {
            boolean related = booking.getItems().stream()
                .anyMatch(i -> i.getSupplier() != null && i.getSupplier().getId().equals(requester.getId()));
            if (!related) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Cette réservation ne concerne pas ce fournisseur");
            }
        }
    }

    private void sendNotification(User recipient, User actor, NotificationType type, String title, String message, String link) {
        if (recipient == null) {
            return;
        }
        if (actor != null && Objects.equals(recipient.getId(), actor.getId())) {
            // Jamais d'auto-notification
            return;
        }
        notifications.create(recipient, type, title, message, link);
    }

    private static String cut(String text, int max) {
        if (text == null) return "";
        return text.length() <= max ? text : text.substring(0, max - 1) + "…";
    }
}

