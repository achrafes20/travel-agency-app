package com.agence.voyage.service;

import com.agence.voyage.dto.OfferRequest;
import com.agence.voyage.dto.OfferResponse;
import com.agence.voyage.dto.OfferSearchResponse;
import com.agence.voyage.entity.City;
import com.agence.voyage.entity.OfferType;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.User;
import com.agence.voyage.repository.CityRepository;
import com.agence.voyage.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
@ActiveProfiles("test")
@Import(OfferService.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
class OfferSearchTest {

    @Autowired
    private OfferService offerService;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private UserRepository userRepository;

    private City marrakech;
    private City fes;
    private User supplier;

    @BeforeEach
    void setUp() {
        marrakech = cityRepository.save(new City("Marrakech", 31.63, -7.98));
        fes = cityRepository.save(new City("Fès", 34.02, -5.0));
        supplier = userRepository.save(new User("Karim", "karim@example.com", "hash", Role.SUPPLIER));
        hotel("Riad Yasmine", marrakech, 950, 6, true, true);
        hotel("Hôtel Atlas", fes, 620, 10, false, true);
        hotel("Hôtel fermé", fes, 300, 4, false, false);
        hotel("Hôtel complet", fes, 400, 0, false, true);
        excursion("Désert d'Agafay", marrakech, 350, 12, true);
    }

    private void hotel(String title, City city, double price, int stock, boolean payOnArrival, boolean active) {
        OfferRequest r = base(OfferType.HOTEL, title, city, price, stock, payOnArrival, active);
        r.setStars(4);
        r.setRoomType("Suite");
        offerService.create(r);
    }

    private void excursion(String title, City city, double price, int stock, boolean payOnArrival) {
        OfferRequest r = base(OfferType.EXCURSION, title, city, price, stock, payOnArrival, true);
        r.setDurationHours(6);
        offerService.create(r);
    }

    private OfferRequest base(OfferType type, String title, City city, double price, int stock,
                              boolean payOnArrival, boolean active) {
        OfferRequest r = new OfferRequest();
        r.setType(type);
        r.setTitle(title);
        r.setBasePrice(price);
        r.setStock(stock);
        r.setCityId(city.getId());
        r.setSupplierId(supplier.getId());
        r.setAllowsPayOnArrival(payOnArrival);
        r.setActive(active);
        return r;
    }

    private static List<String> titles(OfferSearchResponse response) {
        return response.getContent().stream().map(OfferResponse::getTitle).toList();
    }

    @Test
    void search_hidesInactiveAndOutOfStockOffers() {
        OfferSearchResponse response = offerService.search(null, null, null, null, null, 0, 9);

        assertEquals(3, response.getTotalElements());
        assertTrue(titles(response).containsAll(List.of("Riad Yasmine", "Hôtel Atlas", "Désert d'Agafay")));
    }

    @Test
    void search_filtersByCityTypePriceAndPayOnArrival() {
        assertEquals(List.of("Désert d'Agafay", "Riad Yasmine"),
                titles(offerService.search(marrakech.getId(), null, null, null, null, 0, 9)));
        assertEquals(List.of("Désert d'Agafay"),
                titles(offerService.search(null, List.of(OfferType.EXCURSION), null, null, null, 0, 9)));
        assertEquals(List.of("Désert d'Agafay", "Hôtel Atlas"),
                titles(offerService.search(null, null, 700.0, null, "price_asc", 0, 9)));
        assertEquals(2, offerService.search(null, null, null, true, null, 0, 9).getTotalElements());
    }

    @Test
    void search_sortsByPrice() {
        assertEquals(List.of("Désert d'Agafay", "Hôtel Atlas", "Riad Yasmine"),
                titles(offerService.search(null, null, null, null, "price_asc", 0, 9)));
        assertEquals(List.of("Riad Yasmine", "Hôtel Atlas", "Désert d'Agafay"),
                titles(offerService.search(null, null, null, null, "price_desc", 0, 9)));
    }

    @Test
    void search_paginates() {
        OfferSearchResponse first = offerService.search(null, null, null, null, "price_asc", 0, 2);
        OfferSearchResponse second = offerService.search(null, null, null, null, "price_asc", 1, 2);
        OfferSearchResponse beyond = offerService.search(null, null, null, null, "price_asc", 5, 2);

        assertEquals(3, first.getTotalElements());
        assertEquals(2, first.getTotalPages());
        assertEquals(List.of("Désert d'Agafay", "Hôtel Atlas"), titles(first));
        assertEquals(List.of("Riad Yasmine"), titles(second));
        assertTrue(beyond.getContent().isEmpty());
    }

    @Test
    void search_typeCountsIgnoreTheTypeFilterButKeepTheOthers() {
        OfferSearchResponse response = offerService.search(fes.getId(), List.of(OfferType.EXCURSION), null, null, null, 0, 9);

        assertEquals(0, response.getTotalElements());
        assertEquals(1L, response.getTypeCounts().get(OfferType.HOTEL));
        assertEquals(0L, response.getTypeCounts().get(OfferType.EXCURSION));
        assertEquals(950.0, response.getMaxPrice());
    }
}
