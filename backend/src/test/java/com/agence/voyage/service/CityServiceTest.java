package com.agence.voyage.service;

import com.agence.voyage.dto.CityRequest;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.repository.CityRepository;
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
}
