package com.agence.voyage.controller;
import com.agence.voyage.dto.*;
import com.agence.voyage.entity.*;
import com.agence.voyage.security.AppUserDetails;
import com.agence.voyage.service.NotificationService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.HttpStatus;
import io.swagger.v3.oas.annotations.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Map;
@RestController @RequestMapping("/api/notifications")
@Tag(name="Notifications",description="Tous rôles authentifiés, données du sujet JWT exclusivement.")
public class NotificationController {
 private final NotificationService service;
 public NotificationController(NotificationService service){this.service=service;}
 @GetMapping @Operation(summary="Mes notifications paginées")
 public PageResponse<NotificationResponse> list(@AuthenticationPrincipal AppUserDetails u,
  @RequestParam(required=false)Boolean read,@RequestParam(required=false)NotificationCategory category,
  @RequestParam(required=false)NotificationType type,@RequestParam(defaultValue="0")int page,@RequestParam(defaultValue="20")int size){
  return service.list(u.getId(),read,category,type,page,size);
 }
 @GetMapping("/unread-count") @Operation(summary="Nombre de notifications non lues")
 public UnreadCountResponse count(@AuthenticationPrincipal AppUserDetails u){return new UnreadCountResponse(service.unreadCount(u.getId()));}
 @PostMapping("/{id}/read") @Operation(summary="Marquer une notification comme lue")
 public NotificationResponse read(@AuthenticationPrincipal AppUserDetails u,@PathVariable Long id){return service.markRead(u.getId(),id);}
 @PostMapping("/read-all") @Operation(summary="Marquer toutes mes notifications comme lues")
 public Map<String,Integer> all(@AuthenticationPrincipal AppUserDetails u){return Map.of("updated",service.markAllRead(u.getId()));}
 @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @Operation(summary="Supprimer ma notification")
 public void delete(@AuthenticationPrincipal AppUserDetails u,@PathVariable Long id){service.delete(u.getId(),id);}
 @GetMapping("/preferences") @Operation(summary="Mes préférences de notifications")
 public NotificationPreferenceResponse preferences(@AuthenticationPrincipal AppUserDetails u){return service.preferences(u.getId());}
 @PutMapping("/preferences") @Operation(summary="Enregistrer mes préférences")
 public NotificationPreferenceResponse update(@AuthenticationPrincipal AppUserDetails u,@Valid @RequestBody NotificationPreferenceRequest r){return service.updatePreferences(u.getId(),r);}
}
