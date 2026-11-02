package com.agence.voyage.service;

import com.agence.voyage.dto.CityRequest;
import com.agence.voyage.dto.CityResponse;
import com.agence.voyage.entity.City;
import com.agence.voyage.entity.Hotel;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.User;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.exception.ErrorCode;
import com.agence.voyage.repository.CityRepository;
import com.agence.voyage.repository.OfferRepository;
import com.agence.voyage.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest(showSql = false)
@ActiveProfiles("test")
@Import(CityService.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
class CityServiceTest {

    @Autowired
    private CityService cityService;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private OfferRepository offerRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void create_rejectsDuplicateName() {
        CityRequest first = new CityRequest();
        first.setName("Marrakech");
        first.setLatitude(31.6295);
        first.setLongitude(-7.9811);
        cityService.create(first);

        CityRequest duplicate = new CityRequest();
        duplicate.setName("marrakech");
        duplicate.setLatitude(31.0);
        duplicate.setLongitude(-7.0);

        assertThrows(BusinessException.class, () -> cityService.create(duplicate));
        assertEquals(1, cityRepository.count());
    }

    @Test
    void create_rejectsAccentDuplicate() {
        CityRequest first = new CityRequest();
        first.setName("Fès");
        first.setLatitude(34.0181);
        first.setLongitude(-5.0078);
        cityService.create(first);

        CityRequest duplicate = new CityRequest();
        duplicate.setName("Fes");
        duplicate.setLatitude(34.0);
        duplicate.setLongitude(-5.0);

        assertThrows(BusinessException.class, () -> cityService.create(duplicate));
        assertEquals(1, cityRepository.count());
    }

    @Test
    void create_persistsCountryCodeAndAirport() {
        CityRequest req = new CityRequest();
        req.setName("Casablanca");
        req.setLatitude(33.5731111);
        req.setLongitude(-7.5898222);
        req.setCountry("Maroc");
        req.setCountryCode("MA");
        req.setHasAirport(true);

        City saved = cityService.create(req);
        assertNotNull(saved.getId());
        assertEquals("Casablanca", saved.getName());
        assertEquals("casablanca", saved.getNormalizedName());
        assertEquals(33.5731, saved.getLatitude());
        assertEquals(-7.5898, saved.getLongitude());
        assertEquals("Maroc", saved.getCountry());
        assertEquals("MA", saved.getCountryCode());
        assertTrue(saved.getHasAirport());
    }

    @Test
    void delete_isRefusedWhenAnOfferUsesTheCity() {
        City city = cityRepository.save(new City("Fès", 34.0, -5.0));
        User supplier = userRepository.save(new User("Karim", "karim@example.com", "hash", Role.SUPPLIER));
        Hotel hotel = new Hotel();
        hotel.setTitle("Riad");
        hotel.setCity(city);
        hotel.setSupplier(supplier);
        offerRepository.save(hotel);

        BusinessException ex = assertThrows(BusinessException.class, () -> cityService.delete(city.getId()));
        assertEquals(ErrorCode.CONFLICT, ex.getCode());
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
    }

    @Test
    void delete_removesAnUnusedCity() {
        City city = cityRepository.save(new City("Fès", 34.0, -5.0));

        cityService.delete(city.getId());

        assertEquals(0, cityRepository.count());
    }

    @Test
    void findAllResponses_attachesOfferCounts() {
        City c1 = cityRepository.save(new City("Tanger", 35.75, -5.83, "Maroc", "MA", true));
        City c2 = cityRepository.save(new City("Chefchaouen", 35.16, -5.26, "Maroc", "MA", false));
        User supplier = userRepository.save(new User("Karim", "karim2@example.com", "hash", Role.SUPPLIER));

        Hotel h = new Hotel();
        h.setTitle("Hôtel Tanger");
        h.setCity(c1);
        h.setSupplier(supplier);
        offerRepository.save(h);

        List<CityResponse> responses = cityService.findAllResponses();
        assertEquals(2, responses.size());

        CityResponse tangerResp = responses.stream().filter(r -> r.getName().equals("Tanger")).findFirst().orElseThrow();
        assertEquals(1L, tangerResp.getOfferCount());
        assertTrue(tangerResp.getHasAirport());
        assertEquals("MA", tangerResp.getCountryCode());

        CityResponse chefResp = responses.stream().filter(r -> r.getName().equals("Chefchaouen")).findFirst().orElseThrow();
        assertEquals(0L, chefResp.getOfferCount());
        assertEquals(false, chefResp.getHasAirport());
    }
}
