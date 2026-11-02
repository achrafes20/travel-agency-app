package com.agence.voyage.controller;

import com.agence.voyage.dto.ApplyPromoRequest;
import com.agence.voyage.dto.CartItemRequest;
import com.agence.voyage.dto.CartResponse;
import com.agence.voyage.security.AppUserDetails;
import com.agence.voyage.service.CartService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Le panier est toujours celui du client authentifié : aucun identifiant de client n'est accepté dans l'URL. */
@RestController
@io.swagger.v3.oas.annotations.tags.Tag(name = "Panier", description = "CLIENT uniquement : panier du sujet JWT.")
@io.swagger.v3.oas.annotations.responses.ApiResponses({
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Requête invalide", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class))),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Authentification requise", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class))),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Droits insuffisants", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class))),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Ressource introuvable", content = @io.swagger.v3.oas.annotations.media.Content(schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = com.agence.voyage.dto.ApiError.class)))
})
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    @io.swagger.v3.oas.annotations.Operation(summary = "Consulter la ressource", description = "CLIENT uniquement : panier du sujet JWT.")
    public CartResponse get(@AuthenticationPrincipal AppUserDetails principal) {
        return cartService.getCart(principal.getId());
    }

    @PostMapping("/items")
    @io.swagger.v3.oas.annotations.Operation(summary = "Ajouter au panier", description = "CLIENT uniquement : panier du sujet JWT.")
    public CartResponse addItem(@Valid @RequestBody CartItemRequest request,
                                @AuthenticationPrincipal AppUserDetails principal) {
        return cartService.addItem(principal.getId(), request);
    }

    @PutMapping("/items/{itemId}")
    @io.swagger.v3.oas.annotations.Operation(summary = "Modifier une ligne", description = "CLIENT uniquement : panier du sujet JWT.")
    public CartResponse updateItem(@PathVariable Long itemId, @Valid @RequestBody CartItemRequest request,
                                   @AuthenticationPrincipal AppUserDetails principal) {
        return cartService.updateItem(principal.getId(), itemId, request);
    }

    @DeleteMapping("/items/{itemId}")
    @io.swagger.v3.oas.annotations.Operation(summary = "Retirer une ligne", description = "CLIENT uniquement : panier du sujet JWT.")
    public CartResponse removeItem(@PathVariable Long itemId, @AuthenticationPrincipal AppUserDetails principal) {
        return cartService.removeItem(principal.getId(), itemId);
    }

    @DeleteMapping
    @io.swagger.v3.oas.annotations.Operation(summary = "Vider le panier", description = "CLIENT uniquement : panier du sujet JWT.")
    public CartResponse clear(@AuthenticationPrincipal AppUserDetails principal) {
        return cartService.clear(principal.getId());
    }

    @PostMapping("/promo")
    @io.swagger.v3.oas.annotations.Operation(summary = "Appliquer un code promo", description = "CLIENT uniquement : panier du sujet JWT.")
    public CartResponse applyPromo(@Valid @RequestBody ApplyPromoRequest request,
                                   @AuthenticationPrincipal AppUserDetails principal) {
        return cartService.applyPromo(principal.getId(), request.getCode());
    }

    @DeleteMapping("/promo")
    @io.swagger.v3.oas.annotations.Operation(summary = "Retirer le code promo", description = "CLIENT uniquement : panier du sujet JWT.")
    public CartResponse removePromo(@AuthenticationPrincipal AppUserDetails principal) {
        return cartService.removePromo(principal.getId());
    }
}
