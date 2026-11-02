package com.agence.voyage.favorites;

import com.agence.voyage.entity.*;
import com.agence.voyage.repository.*;
import com.agence.voyage.security.AppUserDetails;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:fav_integration_${random.uuid};MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class FavoriteIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private OfferRepository offerRepository;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper mapper;

    private User client1;
    private User client2;
    private User admin;
    private User supplier;
    private City city;
    private Offer activeOffer1;
    private Offer activeOffer2;
    private Offer inactiveOffer;

    private User createUser(String name, Role role) {
        User u = new User(name, "fav-" + UUID.randomUUID() + "@test.ma", "hash", role);
        u.setEmailVerified(true);
        return userRepository.save(u);
    }

    private Offer createHotel(String title, boolean active) {
        Hotel h = new Hotel();
        h.setTitle(title);
        h.setDescription("Magnifique riad au coeur de la medina");
        h.setBasePrice(850.0);
        h.setActive(active);
        h.setCity(city);
        h.setSupplier(supplier);
        h.setImages(List.of("https://example.com/img1.jpg"));
        return offerRepository.save(h);
    }

    @BeforeEach
    void setUp() {
        favoriteRepository.deleteAll();
        offerRepository.deleteAll();

        client1 = createUser("Client Un", Role.CLIENT);
        client2 = createUser("Client Deux", Role.CLIENT);
        admin = createUser("Admin User", Role.ADMIN);
        supplier = createUser("Supplier User", Role.SUPPLIER);

        city = cityRepository.findByNameIgnoreCase("Marrakech").orElseGet(() -> cityRepository.save(new City("Marrakech", 31.6295, -7.9811)));
        activeOffer1 = createHotel("Riad Atlas 1", true);
        activeOffer2 = createHotel("Riad Atlas 2", true);
        inactiveOffer = createHotel("Riad Inactif", false);
    }

    @Test
    @DisplayName("Un client peut ajouter une offre active à ses favoris")
    void addFavorite_success() throws Exception {
        mvc.perform(post("/api/favorites/" + activeOffer1.getId())
                        .with(user(new AppUserDetails(client1))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.offerId").value(activeOffer1.getId()))
                .andExpect(jsonPath("$.title").value("Riad Atlas 1"))
                .andExpect(jsonPath("$.active").value(true));

        assertTrue(favoriteRepository.existsByClientAndOffer(client1, activeOffer1));
    }

    @Test
    @DisplayName("L'ajout d'un favori existant est idempotent et ne duplique pas l'entrée")
    void addFavorite_idempotent() throws Exception {
        mvc.perform(post("/api/favorites/" + activeOffer1.getId())
                        .with(user(new AppUserDetails(client1))))
                .andExpect(status().isCreated());

        mvc.perform(post("/api/favorites/" + activeOffer1.getId())
                        .with(user(new AppUserDetails(client1))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.offerId").value(activeOffer1.getId()));

        assertEquals(1, favoriteRepository.countByClient(client1));
    }

    @Test
    @DisplayName("L'ajout d'une offre inactive en favori est rejeté avec HTTP 400")
    void addFavorite_inactiveOffer_rejected() throws Exception {
        mvc.perform(post("/api/favorites/" + inactiveOffer.getId())
                        .with(user(new AppUserDetails(client1))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("OFFER_INACTIVE"));

        assertFalse(favoriteRepository.existsByClientAndOffer(client1, inactiveOffer));
    }

    @Test
    @DisplayName("L'ajout d'une offre introuvable renvoie HTTP 404")
    void addFavorite_offerNotFound_returns404() throws Exception {
        mvc.perform(post("/api/favorites/9999999")
                        .with(user(new AppUserDetails(client1))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    @DisplayName("Un client peut supprimer un favori et l'opération est idempotente")
    void removeFavorite_successAndIdempotent() throws Exception {
        favoriteRepository.save(new Favorite(client1, activeOffer1));
        assertTrue(favoriteRepository.existsByClientAndOffer(client1, activeOffer1));

        mvc.perform(delete("/api/favorites/" + activeOffer1.getId())
                        .with(user(new AppUserDetails(client1))))
                .andExpect(status().isNoContent());

        assertFalse(favoriteRepository.existsByClientAndOffer(client1, activeOffer1));

        // Idempotent: second delete also succeeds with 204
        mvc.perform(delete("/api/favorites/" + activeOffer1.getId())
                        .with(user(new AppUserDetails(client1))))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("Liste paginée des favoris avec isolation stricte des données client")
    void listFavorites_paginatedAndIsolated() throws Exception {
        favoriteRepository.save(new Favorite(client1, activeOffer1));
        favoriteRepository.save(new Favorite(client1, activeOffer2));
        favoriteRepository.save(new Favorite(client2, activeOffer1));

        // Client 1 has 2 favorites
        mvc.perform(get("/api/favorites?page=0&size=10")
                        .with(user(new AppUserDetails(client1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content", hasSize(2)));

        // Client 2 has 1 favorite
        mvc.perform(get("/api/favorites?page=0&size=10")
                        .with(user(new AppUserDetails(client2))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content", hasSize(1)));
    }

    @Test
    @DisplayName("Obtenir la liste rapide des IDs des offres favorites")
    void listFavoriteIds_returnsIds() throws Exception {
        favoriteRepository.save(new Favorite(client1, activeOffer1));
        favoriteRepository.save(new Favorite(client1, activeOffer2));

        mvc.perform(get("/api/favorites/ids")
                        .with(user(new AppUserDetails(client1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.offerIds", containsInAnyOrder(activeOffer1.getId().intValue(), activeOffer2.getId().intValue())));
    }

    @Test
    @DisplayName("Les rôles non-CLIENT ou non connectés ne peuvent pas accéder aux endpoints favoris")
    void nonClient_cannotAccessFavorites() throws Exception {
        // Unauthenticated
        mvc.perform(get("/api/favorites"))
                .andExpect(status().isUnauthorized());

        // Admin -> 403 Forbidden
        mvc.perform(get("/api/favorites").with(user(new AppUserDetails(admin))))
                .andExpect(status().isForbidden());

        // Supplier -> 403 Forbidden
        mvc.perform(post("/api/favorites/" + activeOffer1.getId()).with(user(new AppUserDetails(supplier))))
                .andExpect(status().isForbidden());
    }
}
