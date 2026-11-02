package com.agence.voyage.controller;

import com.agence.voyage.dto.*;
import com.agence.voyage.entity.*;
import com.agence.voyage.security.AppUserDetails;
import com.agence.voyage.service.*;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/bookings")
@Tag(name="Réservations",description="CLIENT : ses réservations ; SUPPLIER : ses lignes ; AGENT/ADMIN : gestion globale.")
@io.swagger.v3.oas.annotations.responses.ApiResponses({
 @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode="400",description="Validation ou critères invalides",content=@io.swagger.v3.oas.annotations.media.Content(schema=@io.swagger.v3.oas.annotations.media.Schema(implementation=ApiError.class))),
 @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode="401",description="Authentification requise",content=@io.swagger.v3.oas.annotations.media.Content(schema=@io.swagger.v3.oas.annotations.media.Schema(implementation=ApiError.class))),
 @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode="403",description="Rôle insuffisant",content=@io.swagger.v3.oas.annotations.media.Content(schema=@io.swagger.v3.oas.annotations.media.Schema(implementation=ApiError.class))),
 @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode="404",description="Réservation introuvable ou invisible",content=@io.swagger.v3.oas.annotations.media.Content(schema=@io.swagger.v3.oas.annotations.media.Schema(implementation=ApiError.class))),
 @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode="409",description="Conflit métier : capacité, paiement ou état",content=@io.swagger.v3.oas.annotations.media.Content(schema=@io.swagger.v3.oas.annotations.media.Schema(implementation=ApiError.class)))
})
public class BookingController {
 private final BookingService service;
 private final BookingVoucherService vouchers;
 public BookingController(BookingService service,BookingVoucherService vouchers){this.service=service;this.vouchers=vouchers;}
 @PostMapping @ResponseStatus(HttpStatus.CREATED)
 @Operation(summary="Réserver le panier",description="CLIENT. Transaction atomique : prix figés, allocations et vidage du panier.")
 public BookingResponse create(@AuthenticationPrincipal AppUserDetails u,@Valid @RequestBody CreateBookingRequest r){return service.createFromCart(u.getId(),r);}
 @GetMapping({"","/supplier","/admin"})
 @Operation(summary="Lister les réservations",description="Pagination plafonnée à 100 ; périmètre déterminé par le chemin et le rôle.")
 public PageResponse<BookingSummaryResponse> list(@AuthenticationPrincipal AppUserDetails u,
  jakarta.servlet.http.HttpServletRequest request,@RequestParam(required=false) BookingStatus status,
  @RequestParam(required=false) PaymentStatus paymentStatus,@RequestParam(required=false) LocalDate from,
  @RequestParam(required=false) LocalDate to,@RequestParam(required=false) String reference,
  @RequestParam(required=false) String client,@RequestParam(required=false) String clientEmail,
  @RequestParam(required=false) Long supplierId,@RequestParam(required=false) String search,
  @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size,@RequestParam(required=false) String sort){
  String scope=request.getRequestURI().endsWith("/admin")?"admin":request.getRequestURI().endsWith("/supplier")?"supplier":"client";
  return service.list(u.getId(),scope,new BookingService.Filters(status,paymentStatus,from,to,reference,client==null?clientEmail:client,supplierId,search),page,size,sort);
 }
 @GetMapping("/{id}") @Operation(summary="Consulter une réservation",description="Propriétaire, fournisseur concerné (vue filtrée), AGENT ou ADMIN.")
 public BookingResponse get(@AuthenticationPrincipal AppUserDetails u,@PathVariable Long id){return service.get(u.getId(),id);}
 @PostMapping("/{id}/cancel") @Operation(summary="Annuler et restituer la capacité",description="CLIENT propriétaire jusqu'à 48 h avant ; AGENT/ADMIN avec motif obligatoire.")
 public BookingResponse cancel(@AuthenticationPrincipal AppUserDetails u,@PathVariable Long id,@Valid @RequestBody(required=false) CancelBookingRequest r){return service.cancel(u.getId(),id,r);}
 @PostMapping("/{id}/confirm") @Operation(summary="Confirmer manuellement",description="AGENT/ADMIN. Ne simule aucun encaissement.")
 public BookingResponse confirm(@AuthenticationPrincipal AppUserDetails u,@PathVariable Long id){return service.confirm(u.getId(),id);}
 @GetMapping(value="/{id}/voucher",produces=MediaType.APPLICATION_PDF_VALUE)
 @Operation(summary="Télécharger le voucher PDF avec QR signé",description="CLIENT propriétaire, AGENT/ADMIN ; CONFIRMED ou COMPLETED.")
 public ResponseEntity<byte[]> voucher(@AuthenticationPrincipal AppUserDetails u,@PathVariable Long id){
  BookingResponse booking=service.get(u.getId(),id);
  return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=\""+booking.reference()+".pdf\"")
   .header(HttpHeaders.CACHE_CONTROL,"no-store").body(vouchers.generate(booking));
 }
}

