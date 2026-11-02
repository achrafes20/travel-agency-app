package com.agence.voyage.controller;
import com.agence.voyage.dto.*;
import com.agence.voyage.entity.*;
import com.agence.voyage.service.*;
import com.agence.voyage.security.AppUserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.*;
import io.swagger.v3.oas.annotations.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;

@RestController @RequestMapping("/api/payments")
@Tag(name="Paiements",description="Sandbox uniquement. CLIENT propriétaire ; gestion AGENT/ADMIN ; remboursements ADMIN.")
public class PaymentController {
 private final PaymentService service;private final PaymentQueries queries;
 public PaymentController(PaymentService service,PaymentQueries queries){this.service=service;this.queries=queries;}
 private String hash(jakarta.servlet.http.HttpServletRequest request){return (String)request.getAttribute("paymentRequestHash");}
 @PostMapping @Operation(summary="Initier un paiement idempotent")
 public ResponseEntity<PaymentResponse> create(@AuthenticationPrincipal AppUserDetails u,@RequestHeader(value="Idempotency-Key",required=false)String key,
  @Valid @RequestBody PaymentCreateRequest body,jakarta.servlet.http.HttpServletRequest request){
  var reply=service.initiate(u.getId(),key,body,hash(request));return ResponseEntity.status(reply.status()).body(reply.body());
 }
 @GetMapping @Operation(summary="Paiements d'une réservation")
 public List<PaymentResponse> booking(@AuthenticationPrincipal AppUserDetails u,@RequestParam Long bookingId){return queries.forBooking(u.getId(),bookingId);}
 @GetMapping("/{id}") @Operation(summary="Détail d'un paiement")
 public PaymentResponse get(@AuthenticationPrincipal AppUserDetails u,@PathVariable Long id){return queries.get(u.getId(),id);}
 @GetMapping("/{id}/events") @Operation(summary="Historique immuable du paiement")
 public List<PaymentEventResponse> events(@AuthenticationPrincipal AppUserDetails u,@PathVariable Long id){return queries.events(u.getId(),id);}
 @PostMapping("/{id}/refund") @Operation(summary="Rembourser totalement ou partiellement",description="ADMIN uniquement, motif et Idempotency-Key requis.")
 public PaymentResponse refund(@AuthenticationPrincipal AppUserDetails u,@PathVariable Long id,@RequestHeader(value="Idempotency-Key",required=false)String key,
  @Valid @RequestBody PaymentRefundRequest body,jakarta.servlet.http.HttpServletRequest request){return service.refund(u.getId(),id,key,body,hash(request)).body();}
 @PostMapping("/{id}/collect-cash") @Operation(summary="Enregistrer un encaissement espèces",description="AGENT ou ADMIN, montant exact et Idempotency-Key requis.")
 public PaymentResponse collect(@AuthenticationPrincipal AppUserDetails u,@PathVariable Long id,@RequestHeader(value="Idempotency-Key",required=false)String key,
  @Valid @RequestBody CashCollectionRequest body,jakarta.servlet.http.HttpServletRequest request){return service.collect(u.getId(),id,key,body,hash(request)).body();}
 @GetMapping({"/mine","/admin","/cash-pending","/cash-history"}) @Operation(summary="Liste paginée des paiements",description="CLIENT : mine ; AGENT/ADMIN : autres listes.")
 public PageResponse<PaymentResponse> list(@AuthenticationPrincipal AppUserDetails u,jakarta.servlet.http.HttpServletRequest request,
  @RequestParam(required=false)PaymentStatus status,@RequestParam(required=false)PaymentMethod method,
  @RequestParam(required=false)LocalDate from,@RequestParam(required=false)LocalDate to,@RequestParam(required=false)String search,
  @RequestParam(defaultValue="0")int page,@RequestParam(defaultValue="20")int size,@RequestParam(required=false)String sort){
  String path=request.getRequestURI();String scope=path.substring(path.lastIndexOf('/')+1);
  return queries.list(u.getId(),scope,new PaymentQueries.Filters(status,method,from,to,search),page,size,sort);
 }
}

