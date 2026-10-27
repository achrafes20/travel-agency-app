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
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public CartResponse get(@AuthenticationPrincipal AppUserDetails principal) {
        return cartService.getCart(principal.getId());
    }

    @PostMapping("/items")
    public CartResponse addItem(@Valid @RequestBody CartItemRequest request,
                                @AuthenticationPrincipal AppUserDetails principal) {
        return cartService.addItem(principal.getId(), request);
    }

    @PutMapping("/items/{itemId}")
    public CartResponse updateItem(@PathVariable Long itemId, @Valid @RequestBody CartItemRequest request,
                                   @AuthenticationPrincipal AppUserDetails principal) {
        return cartService.updateItem(principal.getId(), itemId, request);
    }

    @DeleteMapping("/items/{itemId}")
    public CartResponse removeItem(@PathVariable Long itemId, @AuthenticationPrincipal AppUserDetails principal) {
        return cartService.removeItem(principal.getId(), itemId);
    }

    @DeleteMapping
    public CartResponse clear(@AuthenticationPrincipal AppUserDetails principal) {
        return cartService.clear(principal.getId());
    }

    @PostMapping("/promo")
    public CartResponse applyPromo(@Valid @RequestBody ApplyPromoRequest request,
                                   @AuthenticationPrincipal AppUserDetails principal) {
        return cartService.applyPromo(principal.getId(), request.getCode());
    }

    @DeleteMapping("/promo")
    public CartResponse removePromo(@AuthenticationPrincipal AppUserDetails principal) {
        return cartService.removePromo(principal.getId());
    }
}
