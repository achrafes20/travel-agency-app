package com.agence.voyage.controller;

import com.agence.voyage.dto.AuditLogFilter;
import com.agence.voyage.dto.AuditLogResponse;
import com.agence.voyage.dto.PageResponse;
import com.agence.voyage.entity.AuditAction;
import com.agence.voyage.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/audit")
@Tag(name = "Audit", description = "Journal d'audit administratif append-only")
public class AuditController {

    private static final int MAX_EXPORT_ROWS = 50000;
    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    @Operation(summary = "Lister les entrǸes du journal d'audit avec filtres et pagination")
    public PageResponse<AuditLogResponse> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) Long resourceId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), 100);

        Sort sortOrder = parseSort(sort);
        AuditLogFilter filter = new AuditLogFilter(startDate, endDate, actor, action, resourceType, resourceId, search);

        Page<AuditLogResponse> result = auditService.findAll(filter, PageRequest.of(safePage, safeSize, sortOrder));

        return new PageResponse<>(
                result.getContent(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                sort
        );
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir le dǸtail complet d'une entrǸe d'audit")
    public AuditLogResponse getById(@PathVariable Long id) {
        return auditService.findById(id);
    }

    @GetMapping("/export")
    @Operation(summary = "Exporter les logs d'audit au format CSV en streaming")
    public void exportCsv(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) Long resourceId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            HttpServletResponse response) throws IOException {

        Sort sortOrder = parseSort(sort);
        AuditLogFilter filter = new AuditLogFilter(startDate, endDate, actor, action, resourceType, resourceId, search);

        List<AuditLogResponse> rows = auditService.findAllForExport(filter, sortOrder, MAX_EXPORT_ROWS);

        // Journaliser l'export
        auditService.log(
                AuditAction.AUDIT_EXPORTED.name(),
                "AUDIT",
                null,
                "Export CSV de " + rows.size() + " entrǸes d'audit",
                null,
                "{\"count\":" + rows.size() + "}"
        );

        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"audit_logs.csv\"");

        try (PrintWriter writer = response.getWriter()) {
            // UTF-8 BOM pour compatibilitǸ Excel
            writer.write('\ufeff');

            // En-tǦtes CSV
            writer.println("id,date_heure,acteur_id,acteur_email,acteur_role,action,type_ressource,id_ressource,description,ip,user_agent");

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

            for (AuditLogResponse r : rows) {
                writer.print(escapeCsv(r.id()));
                writer.print(",");
                writer.print(escapeCsv(r.createdAt() != null ? r.createdAt().format(dtf) : ""));
                writer.print(",");
                writer.print(escapeCsv(r.actorId()));
                writer.print(",");
                writer.print(escapeCsv(r.actorEmail()));
                writer.print(",");
                writer.print(escapeCsv(r.actorRole()));
                writer.print(",");
                writer.print(escapeCsv(r.action()));
                writer.print(",");
                writer.print(escapeCsv(r.resourceType()));
                writer.print(",");
                writer.print(escapeCsv(r.resourceId()));
                writer.print(",");
                writer.print(escapeCsv(r.description()));
                writer.print(",");
                writer.print(escapeCsv(r.ipAddress()));
                writer.print(",");
                writer.println(escapeCsv(r.userAgent()));
            }
            writer.flush();
        }
    }

    private Sort parseSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        String[] parts = sort.split(",");
        String prop = parts[0].trim();
        Sort.Direction dir = (parts.length > 1 && parts[1].trim().equalsIgnoreCase("asc"))
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        return Sort.by(dir, prop);
    }

    private String escapeCsv(Object value) {
        if (value == null) return "";
        String str = String.valueOf(value);

        // Protection contre l'injection de formules CSV (=, +, -, @)
        if (!str.isEmpty() && (str.startsWith("=") || str.startsWith("+") || str.startsWith("-") || str.startsWith("@"))) {
            str = "'" + str;
        }

        // Si la chane contient des virgules, guillemets ou sauts de ligne, on l'entoure de guillemets
        if (str.contains(",") || str.contains("\"") || str.contains("\n") || str.contains("\r")) {
            str = "\"" + str.replace("\"", "\"\"") + "\"";
        }
        return str;
    }
}
