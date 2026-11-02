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
import java.util.Objects;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Ajouter au panier ne consomme aucune capacité. Booking recharge ce panier,
 * verrouille les périodes et réserve atomiquement leurs unités.
 */
@Service
public class CartService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(CartService.class);

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
                .filter(i -> Objects.equals(i.getTravelCriteria(), request.getTravelCriteria()))
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
        if (request.getTravelCriteria() != null) item.setTravelCriteria(request.getTravelCriteria());
        assertAvailable(item, wanted);
        item.setQuantity(wanted);
        if (request.getTravelCriteria() != null) {
            item.setTravelCriteria(request.getTravelCriteria());
        }
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
            throw new BusinessException(com.agence.voyage.exception.ErrorCode.CART_EMPTY, "Votre panier est vide : ajoutez une offre avant d'appliquer un code promo");
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
        Optional<Cart> existing = cartRepository.lockByClientId(clientId);
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
        log.debug("save_cart cartId={} itemCount={}", cart.getId(), cart.getItems().size());
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

    /** Contrôle l'offre (ou chaque offre du bundle) pour les dates demandées. */
    private static void assertAvailable(CartItem item, int wanted) {
        LocalDateTime[] period = requestedPeriod(item.getTravelCriteria());
        if (item.getOffer() != null) {
            Offer offer = item.getOffer();
            if (!OfferService.isAvailable(offer, period[0], period[1], wanted)) {
                if (offer.getAvailabilities() == null || offer.getAvailabilities().isEmpty()) {
                    int legacyCapacity = offer.getStock() == null ? 0 : offer.getStock();
                    if (!Boolean.TRUE.equals(offer.getActive())) throw new BusinessException(com.agence.voyage.exception.ErrorCode.OFFER_INACTIVE, "Cette offre n'est plus disponible");
                    if (legacyCapacity <= 0) throw new BusinessException(com.agence.voyage.exception.ErrorCode.CAPACITY_EXCEEDED, "Cette offre est épuisée");
                    throw new BusinessException(com.agence.voyage.exception.ErrorCode.CAPACITY_EXCEEDED, "Stock insuffisant : " + legacyCapacity + " disponible(s)");
                }
                throw new BusinessException(com.agence.voyage.exception.ErrorCode.OFFER_NOT_AVAILABLE, "Cette offre n'est pas disponible pour la période et le nombre de voyageurs demandés");
            }
        } else {
            Bundle bundle = item.getBundle();
            if (bundle.getOffers().stream().anyMatch(o -> !OfferService.isAvailable(o, period[0], period[1], wanted))) {
                throw new BusinessException(com.agence.voyage.exception.ErrorCode.OFFER_NOT_AVAILABLE, "Une offre de ce bundle n'est pas disponible pour la période demandée");
            }
        }
    }

    public static LocalDateTime[] requestedPeriod(String json) {
        if (json == null || json.isBlank()) return new LocalDateTime[]{null, null};
        LocalDateTime start = extractDate(json, "startDate", "start", "hotelArrival", "flightDepart", "departDate", "pickupDate", "dateFrom", "taxiDeparture", "excursionDate");
        LocalDateTime end = extractDate(json, "endDate", "end", "hotelDeparture", "flightReturn", "returnDate", "dateTo", "taxiReturn");
        if (start != null && end == null) end = start;
        return new LocalDateTime[]{start, end};
    }

    private static LocalDateTime extractDate(String json, String... keys) {
        for (String key : keys) {
            Matcher matcher = Pattern.compile("\\\"" + key + "\\\"\\s*:\\s*\\\"([^\\\"]+)\\\"").matcher(json);
            if (matcher.find()) {
                String value = matcher.group(1);
                try { return LocalDateTime.parse(value); } catch (Exception ignored) {
                    try { return LocalDate.parse(value).atStartOfDay(); } catch (Exception ignoredAgain) { /* autre clé */ }
                }
            }
        }
        return null;
    }
}
