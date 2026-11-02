package com.agence.voyage.config;

import com.agence.voyage.entity.Car;
import com.agence.voyage.entity.City;
import com.agence.voyage.entity.Excursion;
import com.agence.voyage.entity.Flight;
import com.agence.voyage.entity.Hotel;
import com.agence.voyage.entity.Offer;
import com.agence.voyage.entity.OfferAvailability;
import com.agence.voyage.entity.OfferType;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.Setting;
import com.agence.voyage.entity.SettingKeys;
import com.agence.voyage.entity.SettingType;
import com.agence.voyage.entity.TaxiTransfer;
import com.agence.voyage.entity.User;
import com.agence.voyage.repository.CityRepository;
import com.agence.voyage.repository.OfferRepository;
import com.agence.voyage.repository.SettingRepository;
import com.agence.voyage.repository.UserRepository;
import com.agence.voyage.service.NotificationDemoSeeder;
import com.agence.voyage.util.CityNormalizer;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Component
@Order(0)
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CityRepository cityRepository;
    private final PasswordEncoder passwordEncoder;
    private final OfferRepository offerRepository;
    private final SettingRepository settingRepository;
    private final AppProperties properties;
    private final NotificationDemoSeeder notifications;

    public DataSeeder(UserRepository userRepository, CityRepository cityRepository, PasswordEncoder passwordEncoder,
                      OfferRepository offerRepository, SettingRepository settingRepository, AppProperties properties,
                      NotificationDemoSeeder notifications) {
        this.userRepository = userRepository;
        this.cityRepository = cityRepository;
        this.passwordEncoder = passwordEncoder;
        this.offerRepository = offerRepository;
        this.settingRepository = settingRepository;
        this.properties = properties;
        this.notifications = notifications;
    }

    @Override
    public void run(String... args) {
        // L'historique statistique dev est ajouté ensuite par StatsDemoSeeder (@Order(20)).
        seedUsers();
        seedCities();
        seedOffers();
        if (properties.seed().extended()) {
            seedExtendedOffers();
        }
        seedSettings();
        notifications.seed();
    }

    private void seedUsers() {
        String encoded = passwordEncoder.encode(properties.seed().password());
        seedUser("Sarah Benali", "sarah.benali@example.com", encoded, Role.CLIENT, null);
        seedUser("Karim Riads", "karim.idrissi@atlasvoyage.ma", encoded, Role.SUPPLIER, OfferType.HOTEL);
        seedUser("Yassine Aviation", "vols@atlasvoyage.ma", encoded, Role.SUPPLIER, OfferType.FLIGHT);
        seedUser("Salma Auto", "voitures@atlasvoyage.ma", encoded, Role.SUPPLIER, OfferType.CAR);
        seedUser("Hamza Transferts", "transferts@atlasvoyage.ma", encoded, Role.SUPPLIER, OfferType.TAXI_TRANSFER);
        seedUser("Leila Expériences", "excursions@atlasvoyage.ma", encoded, Role.SUPPLIER, OfferType.EXCURSION);
        seedUser("Nadia El Fassi", "nadia.elfassi@atlasvoyage.ma", encoded, Role.AGENT, null);
        seedUser("Omar Tazi", "omar.tazi@atlasvoyage.ma", encoded, Role.ADMIN, null);
        hashLegacyPasswords();
    }

    private void seedUser(String name, String email, String password, Role role, OfferType category) {
        User user = userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            User created = new User(name, email, password, role);
            created.setCountry("MA");
            created.setPhone("+212612345678");
            return created;
        });
        user.setSupplierCategory(role == Role.SUPPLIER ? category : null);
        user.setEmailVerified(true);
        userRepository.save(user);
    }

    private void hashLegacyPasswords() {
        for (User user : userRepository.findAll()) {
            String password = user.getPassword();
            if (password != null && !password.startsWith("$2")) {
                user.setPassword(passwordEncoder.encode(password));
                userRepository.save(user);
            }
        }
    }

    private void seedCities() {
        seedCity("Chefchaouen", 35.1688, -5.2697, "Maroc", "MA", false);
        seedCity("Marrakech", 31.6295, -7.9811, "Maroc", "MA", true);
        seedCity("Fès", 34.0181, -5.0078, "Maroc", "MA", true);
        seedCity("Essaouira", 31.5085, -9.7595, "Maroc", "MA", false);
        seedCity("Tanger", 35.7595, -5.8340, "Maroc", "MA", true);
        seedCity("Casablanca", 33.5731, -7.5898, "Maroc", "MA", true);
        seedCity("Agadir", 30.4278, -9.5981, "Maroc", "MA", true);
        seedCity("Ouarzazate", 30.9189, -6.8934, "Maroc", "MA", true);
        seedCity("Rabat", 34.0209, -6.8416, "Maroc", "MA", true);
    }

    private void seedCity(String name, Double lat, Double lon, String country, String code, boolean airport) {
        String normalized = CityNormalizer.normalizeForComparison(name);
        cityRepository.findByNormalizedName(normalized)
                .or(() -> cityRepository.findByNameIgnoreCase(name))
                .ifPresentOrElse(c -> {
            boolean updated = false;
            if (c.getNormalizedName() == null || c.getNormalizedName().isBlank()) {
                c.setNormalizedName(normalized);
                updated = true;
            }
            if (c.getCountry() == null || c.getCountry().isBlank()) {
                c.setCountry(country);
                updated = true;
            }
            if (c.getCountryCode() == null || c.getCountryCode().isBlank()) {
                c.setCountryCode(code);
                updated = true;
            }
            if (!Boolean.TRUE.equals(c.getHasAirport()) && airport) {
                c.setHasAirport(true);
                updated = true;
            }
            if (updated) {
                cityRepository.save(c);
            }
        }, () -> {
            City c = new City(name, lat, lon, country, code, airport);
            cityRepository.save(c);
        });
    }

    private City city(String name) {
        String norm = CityNormalizer.normalizeForComparison(name);
        return cityRepository.findByNormalizedName(norm)
                .or(() -> cityRepository.findByNameIgnoreCase(name))
                .orElseThrow(() -> new IllegalStateException("Ville introuvable : " + name));
    }

    private void seedOffers() {
        User hotelSupplier = supplier("karim.idrissi@atlasvoyage.ma");
        User flightSupplier = supplier("vols@atlasvoyage.ma");
        User carSupplier = supplier("voitures@atlasvoyage.ma");
        User transferSupplier = supplier("transferts@atlasvoyage.ma");
        User excursionSupplier = supplier("excursions@atlasvoyage.ma");
        if (cityRepository.count() == 0) return;

        City marrakech = city("Marrakech");
        City fes = city("Fès");
        City chefchaouen = city("Chefchaouen");
        City essaouira = city("Essaouira");
        City tanger = city("Tanger");
        LocalDate today = LocalDate.now();

        Hotel riad = base(new Hotel(), "Riad Atlas Prestige", "Riad traditionnel avec patio, petit-déjeuner et terrasse panoramique.", 1450d, marrakech, hotelSupplier,
                List.of("http://localhost:5500/frontend/images/marrakech.jpg"), periods(today, 12, 4));
        riad.setStars(5); riad.setRoomType("Suite double supérieure"); riad.setAddress("Médina, Marrakech"); riad.setAllowsPayOnArrival(true);
        Hotel dar = base(new Hotel(), "Dar Zitoune Fès", "Séjour authentique au cœur de la médina de Fès.", 980d, fes, hotelSupplier,
                List.of("http://localhost:5500/frontend/images/fes.jpg"), periods(today.plusDays(3), 8, 3));
        dar.setStars(4); dar.setRoomType("Chambre traditionnelle"); dar.setAddress("Fès El Bali"); dar.setAllowsPayOnArrival(true);

        Flight flight1 = base(new Flight(), "Vol Casablanca vers Marrakech", "Vol direct intérieur opéré par Royal Air Maroc.", 890d, marrakech, flightSupplier,
                List.of("http://localhost:5500/frontend/images/offers/vol-casablanca-marrakech.jpg"), flightPeriod(today.plusDays(10), 9, 30, 24));
        flight1.setAirline("Royal Air Maroc"); flight1.setFlightNumber("AT-401"); flight1.setDepartureAirport("Casablanca (CMN)"); flight1.setArrivalAirport("Marrakech (RAK)");
        flight1.setDepartureDateTime(today.plusDays(10).atTime(9, 30)); flight1.setArrivalDateTime(today.plusDays(10).atTime(10, 20));
        flight1.setRoundTrip(false); flight1.setCabinClass("ECONOMY");
        Flight flight2 = base(new Flight(), "Vol Tanger vers Casablanca", "Liaison rapide entre Tanger et Casablanca.", 760d, tanger, flightSupplier,
                List.of("http://localhost:5500/frontend/images/offers/vol-paris-casablanca.jpg"), flightRoundTripPeriods(today.plusDays(18), today.plusDays(22), 18));
        flight2.setAirline("Royal Air Maroc"); flight2.setFlightNumber("AT-471"); flight2.setDepartureAirport("Tanger (TNG)"); flight2.setArrivalAirport("Casablanca (CMN)");
        flight2.setDepartureDateTime(today.plusDays(18).atTime(16, 0)); flight2.setArrivalDateTime(today.plusDays(18).atTime(17, 5));
        flight2.setRoundTrip(true); flight2.setReturnDepartureDateTime(today.plusDays(22).atTime(18, 0)); flight2.setReturnArrivalDateTime(today.plusDays(22).atTime(19, 5)); flight2.setCabinClass("BUSINESS");

        Car duster = base(new Car(), "Dacia Duster automatique", "SUV confortable adapté aux routes et excursions marocaines.", 520d, marrakech, carSupplier,
                List.of("http://localhost:5500/frontend/images/offers/dacia-logan.jpg"), periods(today, 3, 2));
        duster.setBrand("Dacia"); duster.setModel("Duster"); duster.setTransmission("Automatique"); duster.setSeats(5);
        duster.setPickupLocation("Marrakech, aéroport ou gare"); duster.setDropoffLocations(List.of("Marrakech Menara (MA)", "Gare de Marrakech (MA)", "Médina de Marrakech (MA)"));
        duster.setAllowsDifferentDropoff(true); duster.setMinimumDriverAge(21); duster.setMaximumDriverAge(75);
        Car clio = base(new Car(), "Renault Clio économique", "Citadine économique avec kilométrage inclus.", 340d, essaouira, carSupplier,
                List.of("http://localhost:5500/frontend/images/offers/renault-clio.jpg"), periods(today.plusDays(2), 4, 3));
        clio.setBrand("Renault"); clio.setModel("Clio"); clio.setTransmission("Manuelle"); clio.setSeats(5);
        clio.setPickupLocation("Essaouira, aéroport ou gare"); clio.setDropoffLocations(List.of("Essaouira (MA)"));
        clio.setAllowsDifferentDropoff(false); clio.setMinimumDriverAge(23); clio.setMaximumDriverAge(70);

        TaxiTransfer taxi1 = base(new TaxiTransfer(), "Transfert aéroport Marrakech", "Accueil à l'aéroport et transfert privé vers votre hébergement.", 280d, marrakech, transferSupplier,
                List.of("http://localhost:5500/frontend/images/offers/taxi-marrakech-mercedes.jpg"), periods(today, 10, 4));
        taxi1.setPickupLocation("Aéroport Marrakech-Menara"); taxi1.setDropoffLocation("Médina de Marrakech"); taxi1.setVehicleType("Berline climatisée");
        TaxiTransfer taxi2 = base(new TaxiTransfer(), "Transfert Tanger vers Chefchaouen", "Transfert privé porte-à-porte avec chauffeur professionnel.", 650d, chefchaouen, transferSupplier,
                List.of("http://localhost:5500/frontend/images/offers/taxi-tanger-bleu.jpg"), periods(today.plusDays(1), 6, 2));
        taxi2.setPickupLocation("Aéroport Tanger Ibn Battouta"); taxi2.setDropoffLocation("Chefchaouen"); taxi2.setVehicleType("Minivan 7 places");

        Excursion desert = base(new Excursion(), "Journée désert et kasbah", "Découverte des paysages du Sud, kasbahs et déjeuner traditionnel.", 850d, marrakech, excursionSupplier,
                List.of("http://localhost:5500/frontend/images/offers/kasbah-ouarzazate.jpg"), excursionPeriods(today.plusDays(5), 5, 12));
        desert.setDurationHours(10); desert.setIncludesGuide(true); desert.setIncludesTransport(true); desert.setItinerary("Marrakech — Aït-Ben-Haddou — Ouarzazate — Marrakech");
        Excursion akchour = base(new Excursion(), "Randonnée aux cascades d'Akchour", "Randonnée guidée dans le parc naturel de Talassemtane.", 390d, chefchaouen, excursionSupplier,
                List.of("http://localhost:5500/frontend/images/chefchaouen.jpg"), excursionPeriods(today.plusDays(4), 4, 10));
        akchour.setDurationHours(7); akchour.setIncludesGuide(true); akchour.setIncludesTransport(false); akchour.setItinerary("Chefchaouen — Akchour — Pont de Dieu");

        List<Offer> seeded = List.of(riad, dar, flight1, flight2, duster, clio, taxi1, taxi2, desert, akchour);
        saveOrUpdateOffers(seeded);
    }

    private void seedExtendedOffers() {
        User hotelSupplier = supplier("karim.idrissi@atlasvoyage.ma");
        User carSupplier = supplier("voitures@atlasvoyage.ma");
        User excursionSupplier = supplier("excursions@atlasvoyage.ma");

        City casablanca = city("Casablanca");
        City agadir = city("Agadir");
        City ouarzazate = city("Ouarzazate");
        LocalDate today = LocalDate.now();

        Hotel hotelCasa = base(new Hotel(), "Grand Hôtel Casablanca Port", "Hôtel d'affaires moderne proche de la marina de Casablanca.", 1200d, casablanca, hotelSupplier,
                List.of("http://localhost:5500/frontend/images/offers/hotel-casablanca.jpg"), periods(today.plusDays(1), 14, 6));
        hotelCasa.setStars(4); hotelCasa.setRoomType("Chambre Deluxe"); hotelCasa.setAddress("Boulevard des Almohades, Casablanca"); hotelCasa.setAllowsPayOnArrival(true);

        Car suvAgadir = base(new Car(), "Toyota Prado 4x4 Agadir", "Véhicule tout-terrain idéal pour sillonner la côte et le Souss.", 750d, agadir, carSupplier,
                List.of("http://localhost:5500/frontend/images/offers/toyota-prado.jpg"), periods(today.plusDays(2), 7, 3));
        suvAgadir.setBrand("Toyota"); suvAgadir.setModel("Land Cruiser Prado"); suvAgadir.setTransmission("Automatique"); suvAgadir.setSeats(7);
        suvAgadir.setPickupLocation("Aéroport Agadir Al Massira"); suvAgadir.setDropoffLocations(List.of("Agadir (MA)"));
        suvAgadir.setAllowsDifferentDropoff(false); suvAgadir.setMinimumDriverAge(25); suvAgadir.setMaximumDriverAge(75);

        Excursion kasbahOuarzazate = base(new Excursion(), "Kasbahs et Studios de Cinéma Ouarzazate", "Visite des célèbres studios Atlas et de la Kasbah de Taourirt.", 480d, ouarzazate, excursionSupplier,
                List.of("http://localhost:5500/frontend/images/offers/ouarzazate-cinema.jpg"), excursionPeriods(today.plusDays(3), 6, 8));
        kasbahOuarzazate.setDurationHours(5); kasbahOuarzazate.setIncludesGuide(true); kasbahOuarzazate.setIncludesTransport(true); kasbahOuarzazate.setItinerary("Ouarzazate — Kasbah Taourirt — Atlas Film Studios");

        saveOrUpdateOffers(List.of(hotelCasa, suvAgadir, kasbahOuarzazate));
    }

    private void saveOrUpdateOffers(List<Offer> offers) {
        for (Offer desired : offers) {
            Offer existing = offerRepository.findByTitleIgnoreCase(desired.getTitle()).orElse(null);
            if (existing == null) {
                offerRepository.save(desired);
            } else {
                boolean changed = false;
                if (!existing.getSupplier().getId().equals(desired.getSupplier().getId())) {
                    existing.setSupplier(desired.getSupplier());
                    changed = true;
                }
                if (existing instanceof Car current && desired instanceof Car template) {
                    current.setPickupLocation(template.getPickupLocation());
                    current.setDropoffLocations(template.getDropoffLocations());
                    current.setAllowsDifferentDropoff(template.getAllowsDifferentDropoff());
                    current.setMinimumDriverAge(template.getMinimumDriverAge());
                    current.setMaximumDriverAge(template.getMaximumDriverAge());
                    changed = true;
                }
                if (changed) {
                    offerRepository.save(existing);
                }
            }
        }
    }

    private User supplier(String email) {
        return userRepository.findByEmailIgnoreCase(email).orElseThrow();
    }

    private <T extends Offer> T base(T offer, String title, String description, double price, City city, User supplier,
                                     List<String> images, List<OfferAvailability> availabilities) {
        offer.setTitle(title);
        offer.setDescription(description);
        offer.setBasePrice(price);
        offer.setCity(city);
        offer.setSupplier(supplier);
        offer.setImages(images);
        offer.setAvailabilities(availabilities);
        offer.setActive(true);
        offer.setAllowsPayOnArrival(false);
        return offer;
    }

    private List<OfferAvailability> periods(LocalDate start, int days, int capacity) {
        return List.of(
                new OfferAvailability(start.atStartOfDay(), start.plusDays(days).atTime(LocalTime.MAX), capacity),
                new OfferAvailability(start.plusDays(days + 3).atStartOfDay(), start.plusDays(days * 2L + 3).atTime(LocalTime.MAX), capacity));
    }

    private List<OfferAvailability> flightPeriod(LocalDate date, int hour, int minute, int capacity) {
        LocalDateTime departure = date.atTime(hour, minute);
        return List.of(new OfferAvailability(departure.minusHours(2), departure.plusHours(4), capacity));
    }

    private List<OfferAvailability> flightRoundTripPeriods(LocalDate outbound, LocalDate inbound, int capacity) {
        return List.of(new OfferAvailability(outbound.atTime(14, 0), outbound.atTime(22, 0), capacity),
                new OfferAvailability(inbound.atTime(16, 0), inbound.atTime(23, 0), capacity));
    }

    private List<OfferAvailability> excursionPeriods(LocalDate firstDate, int occurrences, int capacity) {
        return java.util.stream.IntStream.range(0, occurrences)
                .mapToObj(i -> new OfferAvailability(firstDate.plusDays(i * 3L).atTime(7, 0), firstDate.plusDays(i * 3L).atTime(20, 0), capacity))
                .toList();
    }

    private void seedSettings() {
        seedSetting(SettingKeys.BOOKING_CANCELLATION_HOURS, "48", SettingType.INTEGER, "Délai d'annulation client (heures)", 0.0, 720.0);
        seedSetting(SettingKeys.PAYMENT_EXPIRATION_MINUTES, "30", SettingType.INTEGER, "Délai d'expiration du paiement (minutes)", 5.0, 1440.0);
        seedSetting(SettingKeys.OFFERS_IMAGES_MAX, "5", SettingType.INTEGER, "Nombre maximum d'images par offre", 1.0, 10.0);
        seedSetting(SettingKeys.CURRENCY_DEFAULT, "MAD", SettingType.STRING, "Devise par défaut de la plateforme", null, null);
        seedSetting(SettingKeys.PAYMENT_CASH_ENABLED, "true", SettingType.BOOLEAN, "Autoriser le paiement en espèces à l'arrivée", null, null);
        seedSetting(SettingKeys.MAINTENANCE_ENABLED, "false", SettingType.BOOLEAN, "Activer le mode maintenance", null, null);
        seedSetting(SettingKeys.MAINTENANCE_MESSAGE, "Atlas Voyage est actuellement en maintenance. Nous serons de retour très bientôt.", SettingType.STRING, "Message affiché aux visiteurs pendant la maintenance", null, null);
    }

    private void seedSetting(String key, String defaultValue, SettingType type, String description, Double min, Double max) {
        if (!settingRepository.existsBySettingKey(key)) {
            Setting setting = new Setting(key, defaultValue, type, description, min, max, "SYSTEM");
            settingRepository.save(setting);
        }
    }
}
