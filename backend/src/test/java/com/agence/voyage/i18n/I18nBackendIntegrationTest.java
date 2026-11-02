package com.agence.voyage.i18n;

import com.agence.voyage.dto.OfferTranslationRequest;
import com.agence.voyage.dto.UserPreferencesRequest;
import com.agence.voyage.entity.*;
import com.agence.voyage.repository.*;
import com.agence.voyage.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.MessageSource;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class I18nBackendIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private MessageSource messageSource;
    @Autowired private UserRepository userRepository;
    @Autowired private CityRepository cityRepository;
    @Autowired private OfferRepository offerRepository;
    @Autowired private OfferTranslationRepository offerTranslationRepository;
    @Autowired private CityTranslationRepository cityTranslationRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;

    private User clientUser;
    private User supplierUser;
    private String clientToken;
    private String supplierToken;
    private City marrakech;
    private Offer testHotel;

    @BeforeEach
    void setUp() {
        offerTranslationRepository.deleteAll();
        cityTranslationRepository.deleteAll();

        marrakech = cityRepository.save(new City("Marrakech", 31.6295, -7.9811));

        clientUser = new User("Fatima Zahra", "fatima.i18n@atlasvoyage.ma", passwordEncoder.encode("Password123!@#"), Role.CLIENT);
        clientUser.setEmailVerified(true);
        clientUser.setPreferredLanguage("fr");
        clientUser.setPreferredCurrency("MAD");
        clientUser = userRepository.save(clientUser);
        clientToken = jwtService.generateToken(clientUser);

        supplierUser = new User("Karim Hotelier", "karim.i18n@atlasvoyage.ma", passwordEncoder.encode("Password123!@#"), Role.SUPPLIER);
        supplierUser.setEmailVerified(true);
        supplierUser.setSupplierCategory(OfferType.HOTEL);
        supplierUser = userRepository.save(supplierUser);
        supplierToken = jwtService.generateToken(supplierUser);

        Hotel hotel = new Hotel();
        hotel.setTitle("Riad Atlas Féerique");
        hotel.setDescription("Un havre de paix au cœur de la médina.");
        hotel.setBasePrice(1200.0);
        hotel.setCity(marrakech);
        hotel.setSupplier(supplierUser);
        hotel.setStars(5);
        hotel.setRoomType("Suite Deluxe");
        hotel.setAddress("Derb Dabachi, Médina");
        hotel.setActive(true);
        testHotel = offerRepository.save(hotel);
    }

    @Test
    @DisplayName("MessageSource résout correctement les messages dans les 3 langues (FR, EN, AR)")
    void testMessageSourceResolution() {
        String msgFr = messageSource.getMessage("error.VALIDATION_ERROR", null, Locale.FRENCH);
        String msgEn = messageSource.getMessage("error.VALIDATION_ERROR", null, Locale.ENGLISH);
        String msgAr = messageSource.getMessage("error.VALIDATION_ERROR", null, new Locale("ar"));

        assertThat(msgFr).isEqualTo("Certains champs sont invalides");
        assertThat(msgEn).isEqualTo("Some fields are invalid");
        assertThat(msgAr).isEqualTo("بعض الحقول المدخلة غير صحيحة");
    }

    @Test
    @DisplayName("GET /api/currencies/rates est public et renvoie les devises MAD, EUR, USD, GBP")
    void testCurrencyRatesEndpoint() throws Exception {
        mockMvc.perform(get("/api/currencies/rates"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.base").value("MAD"))
                .andExpect(jsonPath("$.rates.MAD").value(1.0))
                .andExpect(jsonPath("$.rates.EUR").value(0.092))
                .andExpect(jsonPath("$.rates.USD").value(0.100))
                .andExpect(jsonPath("$.rates.GBP").value(0.078))
                .andExpect(jsonPath("$.disclaimer", containsString("MAD")));
    }

    @Test
    @DisplayName("PUT /api/users/me/preferences met à jour la langue et la devise préférées")
    void testUpdateUserPreferences() throws Exception {
        UserPreferencesRequest req = new UserPreferencesRequest("ar", "EUR");

        mockMvc.perform(put("/api/users/me/preferences")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.preferredLanguage").value("ar"))
                .andExpect(jsonPath("$.preferredCurrency").value("EUR"));

        User reloaded = userRepository.findById(clientUser.getId()).orElseThrow();
        assertThat(reloaded.getPreferredLanguage()).isEqualTo("ar");
        assertThat(reloaded.getPreferredCurrency()).isEqualTo("EUR");
    }

    @Test
    @DisplayName("PUT /api/users/me/preferences rejette une langue non supportée (ex: es)")
    void testUpdateUserPreferencesRejectsUnsupportedLang() throws Exception {
        UserPreferencesRequest req = new UserPreferencesRequest("es", "MAD");

        mockMvc.perform(put("/api/users/me/preferences")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Fournisseur peut ajouter et consulter des traductions pour son offre")
    void testOfferTranslationWorkflow() throws Exception {
        OfferTranslationRequest enReq = new OfferTranslationRequest("Magical Atlas Riad", "A peaceful haven in the heart of the medina.");

        // 1. Enregistrer la traduction anglaise
        mockMvc.perform(put("/api/offers/" + testHotel.getId() + "/translations/en")
                        .header("Authorization", "Bearer " + supplierToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(enReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.locale").value("en"))
                .andExpect(jsonPath("$.title").value("Magical Atlas Riad"));

        // 2. Vérifier la liste des traductions
        mockMvc.perform(get("/api/offers/" + testHotel.getId() + "/translations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].locale").value("en"));

        // 3. Consulter l'offre en anglais avec paramètre ?lang=en -> titre traduit
        mockMvc.perform(get("/api/offers/" + testHotel.getId() + "?lang=en"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Magical Atlas Riad"))
                .andExpect(jsonPath("$.availableLanguages", hasItems("fr", "en")));

        // 4. Consulter l'offre en français avec paramètre ?lang=fr -> titre original
        mockMvc.perform(get("/api/offers/" + testHotel.getId() + "?lang=fr"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Riad Atlas Féerique"));
    }

    @Test
    @DisplayName("GET /api/cities avec paramètre ?lang=ar renvoie les noms de villes localisés")
    void testLocalizedCities() throws Exception {
        cityTranslationRepository.save(new CityTranslation(marrakech, "ar", "مراكش"));

        mockMvc.perform(get("/api/cities?lang=ar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].localizedName").value("مراكش"));
    }
}

