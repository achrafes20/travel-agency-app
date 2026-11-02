package com.agence.voyage.controller;

import com.agence.voyage.dto.PageResponse;
import com.agence.voyage.dto.TicketAssigneeUpdateRequest;
import com.agence.voyage.dto.TicketCreateRequest;
import com.agence.voyage.dto.TicketMessageRequest;
import com.agence.voyage.dto.TicketPriorityUpdateRequest;
import com.agence.voyage.dto.TicketResponse;
import com.agence.voyage.dto.TicketStatsResponse;
import com.agence.voyage.dto.TicketStatusUpdateRequest;
import com.agence.voyage.entity.TicketCategory;
import com.agence.voyage.entity.TicketPriority;
import com.agence.voyage.entity.TicketStatus;
import com.agence.voyage.security.AppUserDetails;
import com.agence.voyage.service.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tickets")
@Tag(name = "Tickets", description = "Gestion du support client, des messages et des assignations")
public class TicketController {

    private final TicketService service;

    public TicketController(TicketService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Créer un nouveau ticket de support")
    public TicketResponse create(@AuthenticationPrincipal AppUserDetails u,
                                 @Valid @RequestBody TicketCreateRequest request) {
        return service.create(u.getId(), request);
    }

    @GetMapping
    @Operation(summary = "Lister les tickets de support avec pagination et filtres")
    public PageResponse<TicketResponse> list(
        @AuthenticationPrincipal AppUserDetails u,
        @RequestParam(required = false) TicketStatus status,
        @RequestParam(required = false) TicketPriority priority,
        @RequestParam(required = false) TicketCategory category,
        @RequestParam(required = false) String assigneeId,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "createdAt,desc") String sort
    ) {
        return service.list(u.getId(), status, priority, category, assigneeId, search, page, size, sort);
    }

    @GetMapping("/stats")
    @Operation(summary = "Compteurs statistiques par statut et priorité (agents et admins)")
    public TicketStatsResponse getStats(@AuthenticationPrincipal AppUserDetails u) {
        return service.getStats(u.getId());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulter le détail d'un ticket et son fil de discussion")
    public TicketResponse get(@AuthenticationPrincipal AppUserDetails u, @PathVariable Long id) {
        return service.get(u.getId(), id);
    }

    @PostMapping("/{id}/messages")
    @Operation(summary = "Ajouter un message au fil de discussion")
    public TicketResponse addMessage(@AuthenticationPrincipal AppUserDetails u,
                                     @PathVariable Long id,
                                     @Valid @RequestBody TicketMessageRequest request) {
        return service.addMessage(u.getId(), id, request);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Modifier le statut d'un ticket selon la machine à états")
    public TicketResponse updateStatus(@AuthenticationPrincipal AppUserDetails u,
                                       @PathVariable Long id,
                                       @Valid @RequestBody TicketStatusUpdateRequest request) {
        return service.updateStatus(u.getId(), id, request);
    }

    @PatchMapping("/{id}/assignee")
    @Operation(summary = "Assigner un agent ou administrateur au ticket")
    public TicketResponse updateAssignee(@AuthenticationPrincipal AppUserDetails u,
                                         @PathVariable Long id,
                                         @RequestBody TicketAssigneeUpdateRequest request) {
        return service.updateAssignee(u.getId(), id, request);
    }

    @PatchMapping("/{id}/priority")
    @Operation(summary = "Modifier la priorité d'un ticket (agents et admins)")
    public TicketResponse updatePriority(@AuthenticationPrincipal AppUserDetails u,
                                         @PathVariable Long id,
                                         @Valid @RequestBody TicketPriorityUpdateRequest request) {
        return service.updatePriority(u.getId(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Supprimer un ticket définitivement (administrateurs uniquement)")
    public void delete(@AuthenticationPrincipal AppUserDetails u, @PathVariable Long id) {
        service.delete(u.getId(), id);
    }
}

