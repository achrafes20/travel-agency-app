package com.agence.voyage.service;

import com.agence.voyage.dto.BundleRequest;
import com.agence.voyage.dto.CartItemRequest;
import com.agence.voyage.dto.CartResponse;
import com.agence.voyage.dto.OfferRequest;
import com.agence.voyage.entity.Bundle;
import com.agence.voyage.entity.City;
import com.agence.voyage.entity.DiscountType;
import com.agence.voyage.entity.Offer;
import com.agence.voyage.entity.OfferType;
import com.agence.voyage.entity.PromoCode;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.User;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.exception.ResourceNotFoundException;
import com.agence.voyage.repository.CartRepository;
import com.agence.voyage.repository.CityRepository;
import com.agence.voyage.repository.PromoCodeRepository;
import com.agence.voyage.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
@ActiveProfiles("test")
@Import({CartService.class, PromoCodeService.class, OfferService.class, BundleService.class})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
class CartServiceTest {

    @Autowired
    private CartService cartService;

    @Autowired
    private PromoCodeService promoCodeService;

    @Autowired
    private OfferService offerService;

    @Autowired
    private BundleService bundleService;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private PromoCodeRepository promoCodeRepository;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private UserRepository userRepository;

    private City city;
    private User supplier;
    private User agent;
    private User client;
    private Offer hotel;      // 1000 MAD, stock 8, paiement à l'arrivée
    private Offer excursion;  // 500 MAD, stock 3, paiement en ligne uniquement

    @BeforeEach
    void setUp() {
        city = cityRepository.save(new City("Marrakech", 31.63, -7.98));
        supplier = userRepository.save(new User("Karim", "karim@example.com", "hash", Role.SUPPLIER));
        agent = userRepository.save(new User("Nadia", "nadia@example.com", "hash", Role.AGENT));
        client = userRepository.save(new User("Sarah", "sarah@example.com", "hash", Role.CLIENT));
        hotel = offerService.create(offer(OfferType.HOTEL, "Riad", 1000.0, 8, true));
        excursion = offerService.create(offer(OfferType.EXCURSION, "Désert", 500.0, 3, false));
    }

    private OfferRequest offer(OfferType type, String title, double price, int stock, boolean payOnArrival) {
        OfferRequest r = new OfferRequest();
        r.setType(type);
        r.setTitle(title);
        r.setBasePrice(price);
        r.setStock(stock);
        r.setAllowsPayOnArrival(payOnArrival);
        r.setCityId(city.getId());
        r.setSupplierId(supplier.getId());
        if (type == OfferType.HOTEL) {
            r.setStars(4);
            r.setRoomType("Suite");
        } else {
            r.setDurationHours(6);
        }
        return r;
    }

    private CartItemRequest offerLine(Offer offer, Integer quantity) {
        CartItemRequest r = new CartItemRequest();
        r.setOfferId(offer.getId());
        r.setQuantity(quantity);
        return r;
    }

    private PromoCode promo(String code, DiscountType type, String value, LocalDate expiry) {
        PromoCode p = new PromoCode();
        p.setCode(code);
        p.setDiscountType(type);
        p.setValue(new BigDecimal(value));
        p.setExpiryDate(expiry);
        p.setActive(true);
        return promoCodeRepository.save(p);
    }

    @Test
    void getCart_createsAnEmptyCartOnFirstUse() {
        CartResponse cart = cartService.getCart(client.getId());

        assertNotNull(cart.getId());
        assertTrue(cart.getItems().isEmpty());
        assertEquals(0, cart.getItemCount());
        assertEquals(0.0, cart.getTotal());
        assertFalse(cart.isPayOnArrivalAllowed());
    }

    @Test
    void onlyAClientHasACart() {
        assertThrows(BusinessException.class, () -> cartService.getCart(agent.getId()));
        assertThrows(ResourceNotFoundException.class, () -> cartService.getCart(9999L));
    }

    @Test
    void addItem_mergesTheSameOfferAndComputesTotals() {
        cartService.addItem(client.getId(), offerLine(hotel, 2));
        cartService.addItem(client.getId(), offerLine(excursion, null));
        CartResponse cart = cartService.addItem(client.getId(), offerLine(hotel, 1));

        assertEquals(2, cart.getItems().size());
        assertEquals(3, cart.getItems().get(0).getQuantity());
        assertEquals(3000.0, cart.getItems().get(0).getLineTotal());
        assertNotNull(cart.getItems().get(0).getId());
        assertEquals(4, cart.getItemCount());
        assertEquals(3500.0, cart.getSubtotal());
        assertEquals(3500.0, cart.getTotal());
        assertEquals(OfferType.HOTEL, cart.getItems().get(0).getType());
    }

    @Test
    void addItem_requiresExactlyOneTargetAndAKnownOne() {
        CartItemRequest none = new CartItemRequest();
        CartItemRequest both = offerLine(hotel, 1);
        both.setBundleId(1L);
        CartItemRequest unknown = new CartItemRequest();
        unknown.setOfferId(9999L);

        assertThrows(BusinessException.class, () -> cartService.addItem(client.getId(), none));
        assertThrows(BusinessException.class, () -> cartService.addItem(client.getId(), both));
        assertThrows(ResourceNotFoundException.class, () -> cartService.addItem(client.getId(), unknown));
    }

    @Test
    void addItem_checksActiveAndStock_includingWhatIsAlreadyInTheCart() {
        Offer soldOut = offerService.create(offer(OfferType.HOTEL, "Complet", 300.0, 0, false));
        OfferRequest inactiveRequest = offer(OfferType.HOTEL, "Fermé", 300.0, 5, false);
        inactiveRequest.setActive(false);
        Offer inactive = offerService.create(inactiveRequest);

        assertThrows(BusinessException.class, () -> cartService.addItem(client.getId(), offerLine(soldOut, 1)));
        assertThrows(BusinessException.class, () -> cartService.addItem(client.getId(), offerLine(inactive, 1)));
        assertThrows(BusinessException.class, () -> cartService.addItem(client.getId(), offerLine(excursion, 4)));

        cartService.addItem(client.getId(), offerLine(excursion, 2));
        BusinessException ex = assertThrows(BusinessException.class,
                () -> cartService.addItem(client.getId(), offerLine(excursion, 2)));
        assertEquals("Stock insuffisant : 3 disponible(s)", ex.getMessage());
    }

    @Test
    void updateItem_changesQuantityWithinStock_andRemoveItemDeletesTheLine() {
        CartResponse cart = cartService.addItem(client.getId(), offerLine(excursion, 1));
        Long lineId = cart.getItems().get(0).getId();

        CartItemRequest three = new CartItemRequest();
        three.setQuantity(3);
        assertEquals(1500.0, cartService.updateItem(client.getId(), lineId, three).getTotal());

        CartItemRequest four = new CartItemRequest();
        four.setQuantity(4);
        assertThrows(BusinessException.class, () -> cartService.updateItem(client.getId(), lineId, four));
        assertThrows(BusinessException.class,
                () -> cartService.updateItem(client.getId(), lineId, new CartItemRequest()));
        assertThrows(ResourceNotFoundException.class, () -> cartService.updateItem(client.getId(), 9999L, three));

        assertTrue(cartService.removeItem(client.getId(), lineId).getItems().isEmpty());
        assertThrows(ResourceNotFoundException.class, () -> cartService.removeItem(client.getId(), lineId));
    }

    @Test
    void aCartIsPrivateToItsClient() {
        User other = userRepository.save(new User("Autre", "autre@example.com", "hash", Role.CLIENT));
        Long lineId = cartService.addItem(client.getId(), offerLine(hotel, 1)).getItems().get(0).getId();

        assertThrows(ResourceNotFoundException.class, () -> cartService.removeItem(other.getId(), lineId));
        assertEquals(1, cartService.getCart(client.getId()).getItems().size());
    }

    @Test
    void percentagePromo_reducesTheTotal() {
        promo("ETE20", DiscountType.PERCENTAGE, "20", null);
        cartService.addItem(client.getId(), offerLine(hotel, 1));

        CartResponse cart = cartService.applyPromo(client.getId(), "ete20");

        assertEquals("ETE20", cart.getPromo().getCode());
        assertEquals(200.0, cart.getDiscount());
        assertEquals(800.0, cart.getTotal());
        assertEquals(1000.0, cart.getSubtotal());
    }

    @Test
    void fixedPromo_isCappedAtTheSubtotal() {
        promo("GROS", DiscountType.FIXED, "5000", null);
        cartService.addItem(client.getId(), offerLine(excursion, 1));

        CartResponse cart = cartService.applyPromo(client.getId(), "GROS");

        assertEquals(500.0, cart.getDiscount());
        assertEquals(0.0, cart.getTotal());
    }

    @Test
    void applyPromo_rejectsEmptyCart_unknownAndExpiredCodes_andCanBeRemoved() {
        promo("VIEUX", DiscountType.FIXED, "50", LocalDate.now().minusDays(1));
        promo("OK", DiscountType.FIXED, "50", null);

        assertThrows(BusinessException.class, () -> cartService.applyPromo(client.getId(), "OK"));

        cartService.addItem(client.getId(), offerLine(hotel, 1));
        assertEquals("Code promo invalide",
                assertThrows(BusinessException.class, () -> cartService.applyPromo(client.getId(), "NOPE")).getMessage());
        assertEquals("Ce code promo a expiré",
                assertThrows(BusinessException.class, () -> cartService.applyPromo(client.getId(), "VIEUX")).getMessage());

        cartService.applyPromo(client.getId(), "OK");
        CartResponse cart = cartService.removePromo(client.getId());
        assertNull(cart.getPromo());
        assertEquals(1000.0, cart.getTotal());
    }

    @Test
    void appliedPromo_isDroppedWithAWarningWhenItBecomesInvalid() {
        PromoCode promo = promo("ETE20", DiscountType.PERCENTAGE, "20", null);
        cartService.addItem(client.getId(), offerLine(hotel, 1));
        cartService.applyPromo(client.getId(), "ETE20");

        promo.setActive(false);
        promoCodeRepository.save(promo);
        CartResponse cart = cartService.getCart(client.getId());

        assertNull(cart.getPromo());
        assertEquals(1000.0, cart.getTotal());
        assertEquals("Le code ETE20 a été retiré du panier : ce code promo est désactivé", cart.getPromoWarning());
        assertNull(cartService.getCart(client.getId()).getPromoWarning());
    }

    @Test
    void emptyingTheCart_removesThePromo() {
        promo("ETE20", DiscountType.PERCENTAGE, "20", null);
        Long lineId = cartService.addItem(client.getId(), offerLine(hotel, 1)).getItems().get(0).getId();
        cartService.applyPromo(client.getId(), "ETE20");

        assertNull(cartService.removeItem(client.getId(), lineId).getPromo());

        cartService.addItem(client.getId(), offerLine(hotel, 1));
        cartService.applyPromo(client.getId(), "ETE20");
        CartResponse cleared = cartService.clear(client.getId());
        assertTrue(cleared.getItems().isEmpty());
        assertNull(cleared.getPromo());
    }

    @Test
    void deletingAPromo_detachesItFromCarts() {
        PromoCode promo = promo("ETE20", DiscountType.PERCENTAGE, "20", null);
        cartService.addItem(client.getId(), offerLine(hotel, 1));
        cartService.applyPromo(client.getId(), "ETE20");

        promoCodeService.delete(promo.getId());

        assertNull(cartRepository.findByClientId(client.getId()).orElseThrow().getPromoCode());
    }

    @Test
    void payOnArrival_requiresEveryLineToAllowIt() {
        CartResponse onlyHotel = cartService.addItem(client.getId(), offerLine(hotel, 1));
        assertTrue(onlyHotel.isPayOnArrivalAllowed());

        CartResponse mixed = cartService.addItem(client.getId(), offerLine(excursion, 1));
        assertFalse(mixed.isPayOnArrivalAllowed());
    }

    @Test
    void bundle_isPricedWithItsDiscountAndLimitedByItsLowestStock() {
        BundleRequest br = new BundleRequest();
        br.setTitle("Escapade");
        br.setDiscountPercentage(10.0);
        br.setOfferIds(List.of(hotel.getId(), excursion.getId()));
        br.setCreatedById(agent.getId());
        Bundle bundle = bundleService.create(br);

        CartItemRequest line = new CartItemRequest();
        line.setBundleId(bundle.getId());
        line.setQuantity(2);
        CartResponse cart = cartService.addItem(client.getId(), line);

        assertEquals("BUNDLE", cart.getItems().get(0).getKind());
        assertEquals(1350.0, cart.getItems().get(0).getUnitPrice());
        assertEquals(2700.0, cart.getTotal());
        assertEquals(3, cart.getItems().get(0).getStock());
        assertFalse(cart.isPayOnArrivalAllowed());

        // stock du bundle = 3 (excursion) : une 4e unité est refusée
        CartItemRequest more = new CartItemRequest();
        more.setBundleId(bundle.getId());
        more.setQuantity(2);
        assertThrows(BusinessException.class, () -> cartService.addItem(client.getId(), more));
    }

    @Test
    void lineBecomingUnavailableAfterAdding_isFlagged() {
        cartService.addItem(client.getId(), offerLine(excursion, 2));

        OfferRequest update = offer(OfferType.EXCURSION, "Désert", 500.0, 1, false);
        offerService.update(excursion.getId(), update, supplier.getId());
        CartResponse cart = cartService.getCart(client.getId());

        assertTrue(cart.isHasUnavailableItems());
        assertFalse(cart.getItems().get(0).isAvailable());
        assertEquals("Stock insuffisant : 1 disponible(s)", cart.getItems().get(0).getUnavailableReason());
    }
}
