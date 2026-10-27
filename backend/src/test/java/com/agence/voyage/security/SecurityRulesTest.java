package com.agence.voyage.security;

import com.agence.voyage.entity.City;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.User;
import com.agence.voyage.repository.CityRepository;
import com.agence.voyage.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityRulesTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private User admin;
    private User client;
    private User supplier;
    private User otherSupplier;
    private User agent;
    private Long cityId;

    @BeforeEach
    void setUp() {
        admin = account("admin-rules@example.com", Role.ADMIN);
        client = account("client-rules@example.com", Role.CLIENT);
        supplier = account("supplier-rules@example.com", Role.SUPPLIER);
        otherSupplier = account("other-supplier-rules@example.com", Role.SUPPLIER);
        agent = account("agent-rules@example.com", Role.AGENT);
        cityId = cityRepository.findAll().stream().findFirst()
                .orElseGet(() -> cityRepository.save(new City("Test", 1.0, 1.0))).getId();
    }

    private User account(String email, Role role) {
        return userRepository.findByEmailIgnoreCase(email).orElseGet(() ->
                userRepository.save(new User(role.name(), email, passwordEncoder.encode("password123"), role)));
    }

    private String bearer(User user) {
        return "Bearer " + jwtService.generateToken(user);
    }

    private String hotelJson() {
        return "{\"type\":\"HOTEL\",\"title\":\"Riad\",\"basePrice\":100,\"stock\":2,\"cityId\":" + cityId
                + ",\"stars\":3,\"roomType\":\"Double\"}";
    }

    @Test
    void publicEndpoints_areOpen() throws Exception {
        mvc.perform(get("/api/status")).andExpect(status().isOk());
        mvc.perform(get("/api/offers")).andExpect(status().isOk());
        mvc.perform(get("/api/cities")).andExpect(status().isOk());
        mvc.perform(get("/api/bundles")).andExpect(status().isOk());
    }

    @Test
    void protectedEndpoints_withoutToken_return401WithMessage() throws Exception {
        mvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").exists());
        mvc.perform(post("/api/offers").contentType(MediaType.APPLICATION_JSON).content(hotelJson()))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/users").header("Authorization", "Bearer garbage"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void usersAndCityWrites_requireAdmin() throws Exception {
        mvc.perform(get("/api/users").header("Authorization", bearer(client))).andExpect(status().isForbidden());
        mvc.perform(get("/api/users").header("Authorization", bearer(supplier))).andExpect(status().isForbidden());
        mvc.perform(get("/api/users").header("Authorization", bearer(admin))).andExpect(status().isOk());
        mvc.perform(post("/api/cities").header("Authorization", bearer(agent))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"X\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void offerWrites_requireSupplier() throws Exception {
        mvc.perform(post("/api/offers").header("Authorization", bearer(agent))
                        .contentType(MediaType.APPLICATION_JSON).content(hotelJson()))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/bundles").header("Authorization", bearer(supplier))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void offer_belongsToTheAuthenticatedSupplier() throws Exception {
        // supplierId envoyé dans le corps est ignoré : le propriétaire est l'utilisateur connecté
        String body = hotelJson().replace("{", "{\"supplierId\":" + otherSupplier.getId() + ",");
        String response = mvc.perform(post("/api/offers").header("Authorization", bearer(supplier))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.supplierId").value(supplier.getId()))
                .andReturn().getResponse().getContentAsString();
        String id = response.replaceAll(".*\"id\":(\\d+).*", "$1");

        mvc.perform(put("/api/offers/" + id).header("Authorization", bearer(otherSupplier))
                        .contentType(MediaType.APPLICATION_JSON).content(hotelJson()))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/offers/" + id).header("Authorization", bearer(otherSupplier)))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/offers/" + id).header("Authorization", bearer(supplier)))
                .andExpect(status().isNoContent());
    }

    @Test
    void cart_isReservedToClients() throws Exception {
        mvc.perform(get("/api/cart")).andExpect(status().isUnauthorized());
        for (User other : new User[]{admin, supplier, agent}) {
            mvc.perform(get("/api/cart").header("Authorization", bearer(other))).andExpect(status().isForbidden());
            mvc.perform(post("/api/cart/items").header("Authorization", bearer(other))
                            .contentType(MediaType.APPLICATION_JSON).content("{\"offerId\":1}"))
                    .andExpect(status().isForbidden());
        }
        mvc.perform(get("/api/cart").header("Authorization", bearer(client)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemCount").value(0));
        mvc.perform(post("/api/cart/promo").header("Authorization", bearer(client))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"code\":\"NOPE\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void promoCodes_areReservedToAdmins_andCodesAreUppercased() throws Exception {
        mvc.perform(get("/api/promo-codes")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/promo-codes").header("Authorization", bearer(client))).andExpect(status().isForbidden());
        mvc.perform(post("/api/promo-codes").header("Authorization", bearer(agent))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"x\",\"discountType\":\"FIXED\",\"value\":10}"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/promo-codes").header("Authorization", bearer(admin))).andExpect(status().isOk());

        String response = mvc.perform(post("/api/promo-codes").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"rules10\",\"discountType\":\"PERCENTAGE\",\"value\":10}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("RULES10"))
                .andExpect(jsonPath("$.active").value(true))
                .andReturn().getResponse().getContentAsString();
        String id = response.replaceAll(".*\"id\":(\\d+).*", "$1");
        mvc.perform(post("/api/promo-codes").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"RULES10\",\"discountType\":\"PERCENTAGE\",\"value\":10}"))
                .andExpect(status().isBadRequest());
        mvc.perform(delete("/api/promo-codes/" + id).header("Authorization", bearer(admin)))
                .andExpect(status().isNoContent());
    }

    @Test
    void archivedAccount_tokenIsRefused() throws Exception {
        User temp = account("archived-rules@example.com", Role.CLIENT);
        String token = bearer(temp);
        mvc.perform(get("/api/auth/me").header("Authorization", token)).andExpect(status().isOk());

        temp.setArchived(true);
        userRepository.save(temp);

        mvc.perform(get("/api/auth/me").header("Authorization", token)).andExpect(status().isUnauthorized());
    }

    @Test
    void loginAndRegister_workWithoutToken() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"client-rules@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.user.role").value("CLIENT"));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"client-rules@example.com\",\"password\":\"bad\"}"))
                .andExpect(status().isUnauthorized());
    }
}
