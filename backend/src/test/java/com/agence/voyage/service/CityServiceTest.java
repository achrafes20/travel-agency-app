package com.agence.voyage.service;

import com.agence.voyage.dto.CityRequest;
import com.agence.voyage.entity.City;
import com.agence.voyage.entity.Hotel;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.User;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.repository.CityRepository;
import com.agence.voyage.repository.OfferRepository;
import com.agence.voyage.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DataJpaTest
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
    void delete_isRefusedWhenAnOfferUsesTheCity() {
        City city = cityRepository.save(new City("Fès", 34.0, -5.0));
        User supplier = userRepository.save(new User("Karim", "karim@example.com", "hash", Role.SUPPLIER));
        Hotel hotel = new Hotel();
        hotel.setTitle("Riad");
        hotel.setCity(city);
        hotel.setSupplier(supplier);
        offerRepository.save(hotel);

        assertThrows(BusinessException.class, () -> cityService.delete(city.getId()));
    }

    @Test
    void delete_removesAnUnusedCity() {
        City city = cityRepository.save(new City("Fès", 34.0, -5.0));

        cityService.delete(city.getId());

        assertEquals(0, cityRepository.count());
    }
}
