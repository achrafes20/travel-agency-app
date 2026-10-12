package com.agence.voyage.service;

import com.agence.voyage.dto.BundleRequest;
import com.agence.voyage.dto.BundleResponse;
import com.agence.voyage.dto.OfferRequest;
import com.agence.voyage.entity.Bundle;
import com.agence.voyage.entity.City;
import com.agence.voyage.entity.Offer;
import com.agence.voyage.entity.OfferType;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.User;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.exception.ResourceNotFoundException;
import com.agence.voyage.repository.BundleRepository;
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
import static org.junit.jupiter.api.Assertions.assertThrows;

@DataJpaTest
@ActiveProfiles("test")
@Import({BundleService.class, OfferService.class})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
class BundleServiceTest {

    @Autowired
    private BundleService bundleService;

    @Autowired
    private OfferService offerService;

    @Autowired
    private BundleRepository bundleRepository;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private UserRepository userRepository;

    private City city;
    private User supplier;
    private User agent;
    private Offer hotel;
    private Offer excursion;

    @BeforeEach
    void setUp() {
        city = cityRepository.save(new City("Marrakech", 31.63, -7.98));
        supplier = userRepository.save(new User("Karim", "karim@example.com", "hash", Role.SUPPLIER));
        agent = userRepository.save(new User("Nadia", "nadia@example.com", "hash", Role.AGENT));
        hotel = offerService.create(offer(OfferType.HOTEL, "Riad", 1000.0, 8));
        excursion = offerService.create(offer(OfferType.EXCURSION, "Désert", 500.0, 3));
    }

    private OfferRequest offer(OfferType type, String title, double price, int stock) {
        OfferRequest r = new OfferRequest();
        r.setType(type);
        r.setTitle(title);
        r.setBasePrice(price);
        r.setStock(stock);
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

    private BundleRequest request(Long... offerIds) {
        BundleRequest r = new BundleRequest();
        r.setTitle("  Escapade  ");
        r.setDiscountPercentage(10.0);
        r.setOfferIds(List.of(offerIds));
        r.setCreatedById(agent.getId());
        return r;
    }

    @Test
    void create_computesPriceAndDynamicStock() {
        Bundle bundle = bundleService.create(request(hotel.getId(), excursion.getId()));
        BundleResponse response = BundleResponse.from(bundle);

        assertEquals("Escapade", bundle.getTitle());
        assertEquals(1500.0, response.getSumPrice());
        assertEquals(1350.0, response.getFinalPrice());
        assertEquals(3, response.getStock());
        assertEquals("Désert", response.getLimitingOfferTitle());
        assertEquals(List.of("Marrakech"), response.getCities());
    }

    @Test
    void create_requiresTwoDistinctExistingOffersAndAnAgent() {
        assertThrows(BusinessException.class, () -> bundleService.create(request(hotel.getId())));
        assertThrows(BusinessException.class, () -> bundleService.create(request(hotel.getId(), hotel.getId())));
        assertThrows(ResourceNotFoundException.class, () -> bundleService.create(request(hotel.getId(), 9999L)));

        BundleRequest byClient = request(hotel.getId(), excursion.getId());
        byClient.setCreatedById(supplier.getId());
        assertThrows(BusinessException.class, () -> bundleService.create(byClient));

        assertEquals(0, bundleRepository.count());
    }

    @Test
    void update_replacesOffersAndDiscount() {
        Bundle bundle = bundleService.create(request(hotel.getId(), excursion.getId()));
        Offer third = offerService.create(offer(OfferType.EXCURSION, "Cascades", 300.0, 20));

        BundleRequest changes = request(hotel.getId(), third.getId());
        changes.setDiscountPercentage(20.0);
        BundleResponse response = BundleResponse.from(bundleService.update(bundle.getId(), changes));

        assertEquals(1300.0, response.getSumPrice());
        assertEquals(1040.0, response.getFinalPrice());
        assertEquals(8, response.getStock());
    }

    @Test
    void findAll_filtersByAgentAndDelete_removesBundleButKeepsOffers() {
        User otherAgent = userRepository.save(new User("Autre", "autre@example.com", "hash", Role.AGENT));
        Bundle mine = bundleService.create(request(hotel.getId(), excursion.getId()));
        BundleRequest others = request(hotel.getId(), excursion.getId());
        others.setCreatedById(otherAgent.getId());
        bundleService.create(others);

        assertEquals(2, bundleService.findAll(null).size());
        assertEquals(1, bundleService.findAll(agent.getId()).size());

        bundleService.delete(mine.getId());

        assertEquals(1, bundleRepository.count());
        assertEquals(2, offerService.findAll(null, null).size());
        assertThrows(ResourceNotFoundException.class, () -> bundleService.delete(mine.getId()));
    }
}
