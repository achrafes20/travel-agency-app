package com.agence.voyage.service;

import com.agence.voyage.dto.OfferRequest;
import com.agence.voyage.entity.City;
import com.agence.voyage.entity.Excursion;
import com.agence.voyage.entity.Flight;
import com.agence.voyage.entity.Hotel;
import com.agence.voyage.entity.Offer;
import com.agence.voyage.entity.OfferType;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.User;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.exception.ForbiddenException;
import com.agence.voyage.exception.ResourceNotFoundException;
import com.agence.voyage.repository.CityRepository;
import com.agence.voyage.repository.OfferRepository;
import com.agence.voyage.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@DataJpaTest(showSql = false)
@ActiveProfiles("test")
@Import({OfferService.class,com.agence.voyage.service.AssetAttachmentService.class,com.agence.voyage.profile.AssetTestConfiguration.class})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
class OfferServiceTest {

    @Autowired
    private OfferService offerService;

    @Autowired
    private OfferRepository offerRepository;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private UserRepository userRepository;

    private City city;
    private User supplier;

    @BeforeEach
    void setUp() {
        city = cityRepository.save(new City("Chefchaouen", 35.17, -5.27));
        supplier = userRepository.save(new User("Karim", "karim@example.com", "hash", Role.SUPPLIER));
    }

    private OfferRequest base(OfferType type) {
        OfferRequest r = new OfferRequest();
        r.setType(type);
        r.setTitle("  Offre test  ");
        r.setBasePrice(450.0);
        r.setStock(5);
        r.setCityId(city.getId());
        r.setSupplierId(supplier.getId());
        return r;
    }

    private OfferRequest hotel() {
        OfferRequest r = base(OfferType.HOTEL);
        r.setStars(4);
        r.setRoomType("Suite");
        return r;
    }

    @Test
    void create_persistsEachSubtypeWithItsOwnFields() {
        OfferRequest flight = base(OfferType.FLIGHT);
        flight.setAirline("RAM");
        flight.setDepartureAirport("TNG");
        flight.setArrivalAirport("RAK");
        flight.setDepartureDateTime(LocalDateTime.of(2026, 11, 1, 8, 0));
        flight.setArrivalDateTime(LocalDateTime.of(2026, 11, 1, 9, 30));

        OfferRequest car = base(OfferType.CAR);
        car.setBrand("Dacia");
        car.setSeats(5);
        car.setPickupLocation("Aéroport Marrakech");
        car.setAllowsDifferentDropoff(true);
        car.setDropoffLocation("Gare Marrakech");
        car.setMinimumDriverAge(21);
        car.setMaximumDriverAge(75);

        OfferRequest taxi = base(OfferType.TAXI_TRANSFER);
        taxi.setPickupLocation("Aéroport");
        taxi.setDropoffLocation("Médina");

        OfferRequest excursion = base(OfferType.EXCURSION);
        excursion.setDurationHours(6);
        excursion.setIncludesGuide(true);

        assertInstanceOf(Flight.class, offerService.create(flight));
        assertInstanceOf(Hotel.class, offerService.create(hotel()));
        offerService.create(car);
        offerService.create(taxi);
        assertInstanceOf(Excursion.class, offerService.create(excursion));

        assertEquals(5, offerRepository.count());
        assertEquals(1, offerService.findAll(null, OfferType.HOTEL).size());
    }

    @Test
    void create_trimsTitleAndDefaultsToActive() {
        Offer offer = offerService.create(hotel());

        assertEquals("Offre test", offer.getTitle());
        assertEquals(true, offer.getActive());
    }

    @Test
    void create_createsAndReusesCitySelectedFromGeocoding() {
        OfferRequest first = hotel();
        first.setCityId(null);
        first.setCityName("Tokyo");
        first.setCityLatitude(35.6895);
        first.setCityLongitude(139.6917);

        OfferRequest second = hotel();
        second.setCityId(null);
        second.setCityName("tokyo");
        second.setCityLatitude(35.6895);
        second.setCityLongitude(139.6917);

        Offer created = offerService.create(first);
        Offer reused = offerService.create(second);

        assertEquals("Tokyo", created.getCity().getName());
        assertEquals(created.getCity().getId(), reused.getCity().getId());
        assertEquals(2, cityRepository.count());
    }

    @Test
    void create_rejectsInvalidSubtypeData() {
        OfferRequest badHotel = hotel();
        badHotel.setStars(7);
        assertThrows(BusinessException.class, () -> offerService.create(badHotel));

        OfferRequest badExcursion = base(OfferType.EXCURSION);
        assertThrows(BusinessException.class, () -> offerService.create(badExcursion));

        OfferRequest badFlight = base(OfferType.FLIGHT);
        badFlight.setAirline("RAM");
        badFlight.setDepartureAirport("TNG");
        badFlight.setArrivalAirport("RAK");
        badFlight.setDepartureDateTime(LocalDateTime.of(2026, 11, 1, 10, 0));
        badFlight.setArrivalDateTime(LocalDateTime.of(2026, 11, 1, 9, 0));
        assertThrows(BusinessException.class, () -> offerService.create(badFlight));

        assertEquals(0, offerRepository.count());
    }

    @Test
    void create_rejectsNonSupplierAndUnknownCity() {
        User client = userRepository.save(new User("Sara", "sara@example.com", "hash", Role.CLIENT));
        OfferRequest notSupplier = hotel();
        notSupplier.setSupplierId(client.getId());
        assertThrows(BusinessException.class, () -> offerService.create(notSupplier));

        OfferRequest unknownCity = hotel();
        unknownCity.setCityId(9999L);
        assertThrows(ResourceNotFoundException.class, () -> offerService.create(unknownCity));
    }

    @Test
    void create_rejectsMoreThanFiveImages() {
        OfferRequest r = hotel();
        r.setImages(List.of("a", "b", "c", "d", "e", "f"));

        assertThrows(BusinessException.class, () -> offerService.create(r));
    }

    @Test
    void update_changesFieldsButNotTheType() {
        Offer offer = offerService.create(hotel());

        OfferRequest changes = hotel();
        changes.setTitle("Nouveau titre");
        changes.setStock(2);
        changes.setActive(false);
        Offer updated = offerService.update(offer.getId(), changes);

        assertEquals("Nouveau titre", updated.getTitle());
        assertEquals(2, updated.getStock());
        assertEquals(false, updated.getActive());

        OfferRequest otherType = base(OfferType.EXCURSION);
        otherType.setDurationHours(3);
        assertThrows(BusinessException.class, () -> offerService.update(offer.getId(), otherType));
    }

    @Test
    void findAll_filtersBySupplier() {
        offerService.create(hotel());
        User other = userRepository.save(new User("Autre", "autre@example.com", "hash", Role.SUPPLIER));
        OfferRequest otherOffer = hotel();
        otherOffer.setSupplierId(other.getId());
        offerService.create(otherOffer);

        assertEquals(2, offerService.findAll(null, null).size());
        assertEquals(1, offerService.findAll(supplier.getId(), null).size());
    }

    @Test
    void delete_removesOfferAndFailsWhenMissing() {
        Offer offer = offerService.create(hotel());

        offerService.delete(offer.getId());

        assertEquals(0, offerRepository.count());
        assertThrows(ResourceNotFoundException.class, () -> offerService.delete(offer.getId()));
    }

    @Test
    void updateAndDelete_refuseAnotherSuppliersOffer() {
        Offer offer = offerService.create(hotel());
        User other = userRepository.save(new User("Autre", "autre@example.com", "hash", Role.SUPPLIER));

        assertThrows(ForbiddenException.class, () -> offerService.update(offer.getId(), hotel(), other.getId()));
        assertThrows(ForbiddenException.class, () -> offerService.delete(offer.getId(), other.getId()));
        assertEquals(1, offerRepository.count());

        offerService.update(offer.getId(), hotel(), supplier.getId());
        offerService.delete(offer.getId(), supplier.getId());
        assertEquals(0, offerRepository.count());
    }

    @Test
    void moderate_requiresAdminAndReasonAndKeepsAdminDisabledOfferInactive() {
        Offer offer = offerService.create(hotel());
        User admin = userRepository.save(new User("Admin", "admin-offers@example.com", "hash", Role.ADMIN));
        User client = userRepository.save(new User("Client", "client-offers@example.com", "hash", Role.CLIENT));

        assertThrows(ForbiddenException.class, () -> offerService.moderate(offer.getId(), false, "Motif", client.getId()));
        assertThrows(BusinessException.class, () -> offerService.moderate(offer.getId(), false, " ", admin.getId()));

        Offer disabled = offerService.moderate(offer.getId(), false, "Contenu inexact", admin.getId());
        assertFalse(disabled.getActive());
        assertEquals("Contenu inexact", disabled.getModerationReason());
        assertEquals(admin.getId(), disabled.getModeratedBy().getId());
        assertNotNull(disabled.getModeratedAt());

        OfferRequest supplierChanges = hotel();
        supplierChanges.setTitle("Informations corrigées");
        supplierChanges.setActive(true);
        Offer updated = offerService.update(offer.getId(), supplierChanges, supplier.getId());
        assertFalse(updated.getActive());

        assertEquals(true, offerService.moderate(offer.getId(), true, "Corrections validées", admin.getId()).getActive());
    }

    @Test
    void availability_filtersRequestedPeriodAndRejectsOverlaps() {
        OfferRequest request = hotel();
        OfferRequest.AvailabilityInput first = new OfferRequest.AvailabilityInput();
        first.setStartAt(LocalDateTime.of(2026, 11, 1, 0, 0));
        first.setEndAt(LocalDateTime.of(2026, 11, 10, 23, 59));
        first.setCapacity(2);
        request.setAvailabilities(List.of(first));
        Offer offer = offerService.create(request);

        assertEquals(true, OfferService.isAvailable(offer, LocalDateTime.of(2026, 11, 2, 0, 0), LocalDateTime.of(2026, 11, 8, 0, 0), 2));
        assertEquals(false, OfferService.isAvailable(offer, LocalDateTime.of(2026, 11, 2, 0, 0), LocalDateTime.of(2026, 11, 11, 0, 0), 1));
        assertEquals(false, OfferService.isAvailable(offer, LocalDateTime.of(2026, 11, 2, 0, 0), LocalDateTime.of(2026, 11, 8, 0, 0), 3));

        OfferRequest.AvailabilityInput overlapping = new OfferRequest.AvailabilityInput();
        overlapping.setStartAt(LocalDateTime.of(2026, 11, 5, 0, 0));
        overlapping.setEndAt(LocalDateTime.of(2026, 11, 12, 0, 0));
        overlapping.setCapacity(1);
        request.setAvailabilities(List.of(first, overlapping));
        assertThrows(BusinessException.class, () -> offerService.update(offer.getId(), request));
    }
}
