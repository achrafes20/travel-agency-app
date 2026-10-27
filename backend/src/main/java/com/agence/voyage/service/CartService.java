package com.agence.voyage.service;

import com.agence.voyage.dto.CartItemRequest;
import com.agence.voyage.dto.CartResponse;
import com.agence.voyage.entity.Bundle;
import com.agence.voyage.entity.Cart;
import com.agence.voyage.entity.CartItem;
import com.agence.voyage.entity.Offer;
import com.agence.voyage.entity.PromoCode;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.User;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.exception.ResourceNotFoundException;
import com.agence.voyage.repository.BundleRepository;
import com.agence.voyage.repository.CartRepository;
import com.agence.voyage.repository.OfferRepository;
import com.agence.voyage.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Panier du client connecté. Ajouter au panier ne réserve pas le stock (cahier des charges 5.1) :
 * le stock est contrôlé à l'ajout puis à nouveau au paiement.
 */
@Service
public class CartService {

    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final OfferRepository offerRepository;
    private final BundleRepository bundleRepository;
    private final PromoCodeService promoCodeService;

    public CartService(CartRepository cartRepository, UserRepository userRepository, OfferRepository offerRepository,
                       BundleRepository bundleRepository, PromoCodeService promoCodeService) {
        this.cartRepository = cartRepository;
        this.userRepository = userRepository;
        this.offerRepository = offerRepository;
        this.bundleRepository = bundleRepository;
        this.promoCodeService = promoCodeService;
    }

    @Transactional
    public CartResponse getCart(Long clientId) {
        return view(findOrCreate(clientId));
    }

    @Transactional
    public CartResponse addItem(Long clientId, CartItemRequest request) {
        if ((request.getOfferId() == null) == (request.getBundleId() == null)) {
            throw new BusinessException("Indiquez une offre ou un bundle (un seul des deux)");
        }
        int quantity = request.getQuantity() == null ? 1 : request.getQuantity();
        Cart cart = findOrCreate(clientId);

        CartItem item = cart.getItems().stream()
                .filter(i -> request.getOfferId() != null
                        ? i.getOffer() != null && i.getOffer().getId().equals(request.getOfferId())
                        : i.getBundle() != null && i.getBundle().getId().equals(request.getBundleId()))
                .findFirst().orElse(null);
        if (item == null) {
            item = new CartItem();
            item.setCart(cart);
            if (request.getOfferId() != null) {
                item.setOffer(offerRepository.findById(request.getOfferId()).orElseThrow(() ->
                        new ResourceNotFoundException("Offre introuvable : id=" + request.getOfferId())));
            } else {
                item.setBundle(bundleRepository.findById(request.getBundleId()).orElseThrow(() ->
                        new ResourceNotFoundException("Bundle introuvable : id=" + request.getBundleId())));
            }
            item.setQuantity(0);
            cart.getItems().add(item);
        }
        int wanted = item.getQuantity() + quantity;
        assertAvailable(item, wanted);
        item.setQuantity(wanted);
        return save(cart);
    }

    @Transactional
    public CartResponse updateItem(Long clientId, Long itemId, CartItemRequest request) {
        if (request.getQuantity() == null) {
            throw new BusinessException("La quantité est obligatoire");
        }
        Cart cart = findOrCreate(clientId);
        CartItem item = findItem(cart, itemId);
        assertAvailable(item, request.getQuantity());
        item.setQuantity(request.getQuantity());
        return save(cart);
    }

    @Transactional
    public CartResponse removeItem(Long clientId, Long itemId) {
        Cart cart = findOrCreate(clientId);
        cart.getItems().remove(findItem(cart, itemId));
        if (cart.getItems().isEmpty()) {
            cart.setPromoCode(null);
        }
        return save(cart);
    }

    @Transactional
    public CartResponse clear(Long clientId) {
        Cart cart = findOrCreate(clientId);
        cart.getItems().clear();
        cart.setPromoCode(null);
        return save(cart);
    }

    @Transactional
    public CartResponse applyPromo(Long clientId, String code) {
        Cart cart = findOrCreate(clientId);
        if (cart.getItems().isEmpty()) {
            throw new BusinessException("Votre panier est vide : ajoutez une offre avant d'appliquer un code promo");
        }
        PromoCode promo = promoCodeService.validate(code);
        cart.setPromoCode(promo);
        return save(cart);
    }

    @Transactional
    public CartResponse removePromo(Long clientId) {
        Cart cart = findOrCreate(clientId);
        cart.setPromoCode(null);
        return save(cart);
    }

    private Cart findOrCreate(Long clientId) {
        Optional<Cart> existing = cartRepository.findByClientId(clientId);
        if (existing.isPresent()) {
            return existing.get();
        }
        User client = userRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable : id=" + clientId));
        if (client.getRole() != Role.CLIENT) {
            throw new BusinessException("Seul un client possède un panier");
        }
        Cart cart = new Cart();
        cart.setClient(client);
        return cartRepository.save(cart);
    }

    private CartItem findItem(Cart cart, Long itemId) {
        return cart.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Ligne de panier introuvable : id=" + itemId));
    }

    private CartResponse save(Cart cart) {
        return view(cartRepository.saveAndFlush(cart));
    }

    /** Construit la réponse ; un code promo devenu invalide (expiré, désactivé) est retiré du panier avec un avertissement. */
    private CartResponse view(Cart cart) {
        String warning = null;
        PromoCode promo = cart.getPromoCode();
        if (promo != null) {
            String reason = PromoCodeService.unusableReason(promo);
            if (reason != null) {
                cart.setPromoCode(null);
                cartRepository.save(cart);
                warning = "Le code " + promo.getCode() + " a été retiré du panier : "
                        + Character.toLowerCase(reason.charAt(0)) + reason.substring(1);
            }
        }
        return CartResponse.from(cart, warning);
    }

    /** Contrôle l'offre (ou chaque offre du bundle) : active, et en stock pour la quantité voulue. */
    private static void assertAvailable(CartItem item, int wanted) {
        boolean active;
        int stock;
        if (item.getOffer() != null) {
            Offer offer = item.getOffer();
            active = Boolean.TRUE.equals(offer.getActive());
            stock = offer.getStock() == null ? 0 : offer.getStock();
        } else {
            Bundle bundle = item.getBundle();
            active = bundle.getOffers().stream().allMatch(o -> Boolean.TRUE.equals(o.getActive()));
            // stock dynamique d'un bundle : le plus bas parmi ses offres (cahier des charges 5.3)
            stock = bundle.getOffers().stream().mapToInt(o -> o.getStock() == null ? 0 : o.getStock()).min().orElse(0);
        }
        if (!active) {
            throw new BusinessException("Cette offre n'est plus disponible");
        }
        if (stock <= 0) {
            throw new BusinessException("Cette offre est épuisée");
        }
        if (wanted > stock) {
            throw new BusinessException("Stock insuffisant : " + stock + " disponible(s)");
        }
    }
}
