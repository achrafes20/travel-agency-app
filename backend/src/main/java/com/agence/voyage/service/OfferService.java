package com.agence.voyage.service;

import com.agence.voyage.dto.OfferRequest;
import com.agence.voyage.dto.OfferResponse;
import com.agence.voyage.dto.OfferSearchResponse;
import com.agence.voyage.entity.Car;
import com.agence.voyage.entity.City;
import com.agence.voyage.entity.Excursion;
import com.agence.voyage.entity.Flight;
import com.agence.voyage.entity.Hotel;
import com.agence.voyage.entity.Offer;
import com.agence.voyage.entity.OfferAvailability;
import com.agence.voyage.entity.OfferType;
import com.agence.voyage.entity.AuditAction;
import com.agence.voyage.entity.OfferTranslation;
import com.agence.voyage.repository.OfferTranslationRepository;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.SettingKeys;
import com.agence.voyage.repository.FavoriteRepository;
import org.springframework.lang.Nullable;
import com.agence.voyage.entity.TaxiTransfer;
import com.agence.voyage.entity.User;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.exception.ForbiddenException;
import com.agence.voyage.exception.ResourceNotFoundException;
import com.agence.voyage.repository.CityRepository;
import com.agence.voyage.repository.OfferRepository;
import com.agence.voyage.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;

@Service
public class OfferService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(OfferService.class);

    private static final int MAX_IMAGES = 5;
    private static final int MAX_PAGE_SIZE = 100;

    private final OfferRepository offerRepository;
    private final CityRepository cityRepository;
    private final UserRepository userRepository;
    private final NotificationEvents notifications;
    private final AssetAttachmentService assets;
    private final FavoriteRepository favoriteRepository;
    private final AuditService auditService;
    private final SettingService settingService;
    @Autowired(required = false)
    private OfferTranslationRepository offerTranslationRepository;

    @Autowired
    public OfferService(OfferRepository offerRepository, CityRepository cityRepository, UserRepository userRepository,
                        org.springframework.context.ApplicationEventPublisher publisher, AssetAttachmentService assets,
                        @Nullable FavoriteRepository favoriteRepository,
                        @Nullable AuditService auditService,
                        @Nullable SettingService settingService) {
        this.offerRepository = offerRepository;
        this.cityRepository = cityRepository;
        this.userRepository = userRepository;
        this.notifications=new NotificationEvents(publisher);
        this.assets = assets;
        this.favoriteRepository = favoriteRepository;
        this.auditService = auditService;
        this.settingService = settingService;
    }

    public OfferService(OfferRepository offerRepository, CityRepository cityRepository, UserRepository userRepository,
                        org.springframework.context.ApplicationEventPublisher publisher, AssetAttachmentService assets) {
        this(offerRepository, cityRepository, userRepository, publisher, assets, null, null, null);
    }

    public List<Offer> findAll(Long supplierId, OfferType type) {
        log.debug("list resource=offer");
        List<Offer> offers = supplierId != null
                ? offerRepository.findBySupplierId(supplierId)
                : offerRepository.findAll();
        if (type == null) {
            return offers;
        }
        return offers.stream().filter(o -> typeOf(o) == type).toList();
    }

    /**
     * Construit les DTO pendant que la session JPA est encore ouverte. Les collections
     * d'une offre sont volontairement lazy et ne doivent pas être parcourues par le contrôleur.
     */
    @Transactional(readOnly = true)
    public List<OfferResponse> findAllResponses(Long supplierId, OfferType type) {
        return findAll(supplierId, type).stream().map(OfferResponse::from).toList();
    }

    /**
     * Catalogue public : seules les offres actives et en stock sont proposées.
     * Le filtre de type n'entre pas dans {@code typeCounts}, pour que chaque case à cocher affiche son propre total.
     */
    @Transactional(readOnly = true)
    public OfferSearchResponse search(Long cityId, List<OfferType> types, Double maxPrice, Boolean payOnArrival,
                                      LocalDateTime startAt, LocalDateTime endAt, String sort, int page, int size) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        int safePage = Math.max(page, 0);
        String normalizedSort = PaginationSupport.offerSort(sort);

        List<Offer> available = offerRepository.findAll().stream()
                .filter(o -> Boolean.TRUE.equals(o.getActive()))
                .filter(o -> isAvailable(o, startAt, endAt, 1))
                .toList();
        double catalogueMax = available.stream().mapToDouble(Offer::getBasePrice).max().orElse(0);

        List<Offer> matching = available.stream()
                .filter(o -> cityId == null || o.getCity().getId().equals(cityId))
                .filter(o -> maxPrice == null || o.getBasePrice() <= maxPrice)
                .filter(o -> !Boolean.TRUE.equals(payOnArrival) || Boolean.TRUE.equals(o.getAllowsPayOnArrival()))
                .toList();

        Map<OfferType, Long> typeCounts = new EnumMap<>(OfferType.class);
        for (OfferType type : OfferType.values()) {
            typeCounts.put(type, 0L);
        }
        matching.forEach(o -> typeCounts.merge(typeOf(o), 1L, Long::sum));

        Comparator<Offer> order = PaginationSupport.comparator(normalizedSort);
        List<Offer> filtered = matching.stream()
                .filter(o -> types == null || types.isEmpty() || types.contains(typeOf(o)))
                .sorted(order)
                .toList();

        int totalPages = (int) Math.ceil(filtered.size() / (double) safeSize);
        int from = (int) Math.min((long) safePage * safeSize, filtered.size());
        int to = Math.min(from + safeSize, filtered.size());
        List<OfferResponse> content = filtered.subList(from, to).stream().map(OfferResponse::from).toList();
        return new OfferSearchResponse(content, filtered.size(), totalPages, safePage, safeSize, typeCounts, catalogueMax, normalizedSort);
    }

    public OfferSearchResponse search(Long cityId, List<OfferType> types, Double maxPrice, Boolean payOnArrival,
                                      String sort, int page, int size) {
        return search(cityId, types, maxPrice, payOnArrival, null, null, sort, page, size);
    }

    public static boolean isAvailable(Offer offer, LocalDateTime startAt, LocalDateTime endAt, int quantity) {
        if (!Boolean.TRUE.equals(offer.getActive())) return false;
        if (offer.getAvailabilities() == null || offer.getAvailabilities().isEmpty()) {
            return offer.getStock() != null && offer.getStock() >= quantity;
        }
        if (startAt == null && endAt == null) {
            LocalDateTime now = LocalDateTime.now();
            return offer.getAvailabilities().stream().anyMatch(a -> a.getCapacity() != null && a.getCapacity() >= quantity && a.getEndAt().isAfter(now));
        }
        if (offer instanceof Flight) {
            boolean outbound = offer.getAvailabilities().stream().anyMatch(a -> a.getCapacity() >= quantity
                    && !startAt.toLocalDate().isBefore(a.getStartAt().toLocalDate()) && !startAt.toLocalDate().isAfter(a.getEndAt().toLocalDate()));
            boolean inbound = endAt == null || endAt.toLocalDate().equals(startAt.toLocalDate()) || offer.getAvailabilities().stream().anyMatch(a -> a.getCapacity() >= quantity
                    && !endAt.toLocalDate().isBefore(a.getStartAt().toLocalDate()) && !endAt.toLocalDate().isAfter(a.getEndAt().toLocalDate()));
            return outbound && inbound;
        }
        LocalDateTime requestedStart = startAt == null ? LocalDateTime.now() : startAt;
        LocalDateTime requestedEnd = endAt == null ? requestedStart : endAt;
        return offer.getAvailabilities().stream().anyMatch(a -> a.getCapacity() != null && a.getCapacity() >= quantity
                && !requestedStart.isBefore(a.getStartAt()) && !requestedEnd.isAfter(a.getEndAt()));
    }

    public Offer findById(Long id) {
        return offerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Offre introuvable : id=" + id));
    }

    @Transactional(readOnly = true)
    public OfferResponse findResponseById(Long id, String locale) {
        return toLocalizedResponse(findById(id), locale);
    }

    @Transactional
    public Offer moderate(Long id, boolean active, String reason, Long adminId) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Administrateur introuvable : id=" + adminId));
        if (admin.getRole() != Role.ADMIN || admin.isArchived()) {
            throw new ForbiddenException("Seul un administrateur actif peut modérer une offre");
        }
        String cleanReason = blankToNull(reason);
        if (!active && cleanReason == null) {
            throw new BusinessException("Le motif de désactivation est obligatoire");
        }
        Offer offer = findById(id);
        boolean oldActive = Boolean.TRUE.equals(offer.getActive());
        offer.setActive(active);
        offer.setModerationReason(cleanReason);
        offer.setModeratedAt(LocalDateTime.now());
        offer.setModeratedBy(admin);
        notifications.publish(new com.agence.voyage.event.OfferModerationChangedEvent("moderation:"+java.util.UUID.randomUUID(),
            offer.getId(),offer.getSupplier().getId(),offer.getTitle(),active,cleanReason));
        if (auditService != null) {
            auditService.log(AuditAction.OFFER_MODERATED, "Offer", offer.getId(),
                (active ? "Réactivation" : "Désactivation") + " de l'offre #" + offer.getId() + " (" + offer.getTitle() + ")",
                Map.of("active", oldActive),
                Map.of("active", active, "reason", cleanReason != null ? cleanReason : ""));
        }
        return offerRepository.save(offer);
    }

    @Transactional
    public Offer create(OfferRequest request) {
        Offer offer = newInstance(request.getType());
        apply(offer, request);
        Offer saved=offerRepository.saveAndFlush(offer);
        assets.replaceOfferImages(saved.getSupplier().getId(),saved.getId(),saved.getImages(),java.util.Set.of());
        return saved;
    }

    @Transactional
    public Offer update(Long id, OfferRequest request) {
        Offer offer = findById(id);
        java.util.Set<String> previousImages=new java.util.HashSet<>(offer.getImages());
        if (typeOf(offer) != request.getType()) {
            throw new BusinessException("Le type d'une offre ne peut pas être modifié");
        }
        apply(offer, request);
        assets.replaceOfferImages(offer.getSupplier().getId(),offer.getId(),offer.getImages(),previousImages);
        return offerRepository.save(offer);
    }

    /** Modification par un fournisseur : refusée (403) si l'offre appartient à un autre fournisseur. */
    @Transactional
    public Offer update(Long id, OfferRequest request, Long actingUserId) {
        Offer current = findById(id);
        assertOwner(current, actingUserId);
        boolean adminDisabled = !Boolean.TRUE.equals(current.getActive()) && current.getModeratedBy() != null;
        Offer updated = update(id, request);
        if (adminDisabled) {
            updated.setActive(false);
            updated = offerRepository.save(updated);
        }
        return updated;
    }

    @Transactional
    public void delete(Long id, Long actingUserId) {
        assertOwner(findById(id), actingUserId);
        delete(id);
    }

    private static void assertOwner(Offer offer, Long userId) {
        if (offer.getSupplier() == null || !offer.getSupplier().getId().equals(userId)) {
            throw new ForbiddenException(com.agence.voyage.exception.ErrorCode.NOT_OWNER, "Cette offre appartient à un autre fournisseur");
        }
    }

    @Transactional
    public void delete(Long id) {
        Offer offer = findById(id);
        if (favoriteRepository != null) {
            favoriteRepository.deleteByOffer(offer);
        }
        try {
            assets.replaceOfferImages(offer.getSupplier().getId(),offer.getId(),List.of(),java.util.Set.of());
            offerRepository.delete(offer);
            offerRepository.flush();
            if (auditService != null) {
                auditService.log(AuditAction.OFFER_DELETED, "Offer", offer.getId(),
                    "Suppression de l'offre #" + offer.getId() + " (" + offer.getTitle() + ")",
                    Map.of("id", offer.getId(), "title", offer.getTitle()), null);
            }
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessException(
                    "Impossible de supprimer cette offre : elle est utilisée dans des paniers, bundles ou réservations. "
                            + "Désactivez-la à la place.");
        }
    }

    public static OfferType typeOf(Offer offer) {
        if (offer == null) throw new IllegalArgumentException("L'offre ne peut pas être null");
        Offer real = (Offer) org.hibernate.Hibernate.unproxy(offer);
        if (real instanceof Flight) return OfferType.FLIGHT;
        if (real instanceof Hotel) return OfferType.HOTEL;
        if (real instanceof Car) return OfferType.CAR;
        if (real instanceof TaxiTransfer) return OfferType.TAXI_TRANSFER;
        if (real instanceof Excursion) return OfferType.EXCURSION;
        throw new IllegalStateException("Type d'offre inconnu : " + real.getClass().getSimpleName());
    }

    private static Offer newInstance(OfferType type) {
        return switch (type) {
            case FLIGHT -> new Flight();
            case HOTEL -> new Hotel();
            case CAR -> new Car();
            case TAXI_TRANSFER -> new TaxiTransfer();
            case EXCURSION -> new Excursion();
        };
    }

    private void apply(Offer offer, OfferRequest r) {
        City city = resolveCity(r);
        User supplier = userRepository.findById(r.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Fournisseur introuvable : id=" + r.getSupplierId()));
        if (supplier.getRole() != Role.SUPPLIER || supplier.isArchived()) {
            throw new BusinessException("L'utilisateur indiqué n'est pas un fournisseur actif");
        }
        if (supplier.getSupplierCategory() != null && supplier.getSupplierCategory() != r.getType()) {
            throw new ForbiddenException(com.agence.voyage.exception.ErrorCode.SUPPLIER_CATEGORY_MISMATCH, "Ce compte fournisseur est autorisé uniquement pour les offres de type " + supplier.getSupplierCategory());
        }

        offer.setTitle(r.getTitle().trim());
        offer.setDescription(blankToNull(r.getDescription()));
        offer.setBasePrice(r.getBasePrice());
        List<OfferAvailability> periods = cleanAvailabilities(r.getAvailabilities());
        offer.setAvailabilities(periods);
        offer.setStock(periods.isEmpty() ? (r.getStock() == null ? 0 : r.getStock())
                : periods.stream().mapToInt(OfferAvailability::getCapacity).max().orElse(0));
        if (Boolean.TRUE.equals(r.getAllowsPayOnArrival()) && settingService != null && !settingService.getBoolean(SettingKeys.PAYMENT_CASH_ENABLED)) {
            throw new BusinessException(com.agence.voyage.exception.ErrorCode.PAY_ON_ARRIVAL_NOT_ALLOWED, "Le paiement à l'arrivée est actuellement désactivé sur la plateforme");
        }
        offer.setAllowsPayOnArrival(Boolean.TRUE.equals(r.getAllowsPayOnArrival()));
        offer.setActive(r.getActive() == null || r.getActive());
        offer.setImages(cleanImages(r.getImages()));
        offer.setCity(city);
        offer.setSupplier(supplier);

        if (offer instanceof Flight f) {
            f.setAirline(required(r.getAirline(), "La compagnie aérienne est obligatoire"));
            f.setFlightNumber(blankToNull(r.getFlightNumber()));
            f.setDepartureAirport(required(r.getDepartureAirport(), "L'aéroport de départ est obligatoire"));
            f.setArrivalAirport(required(r.getArrivalAirport(), "L'aéroport d'arrivée est obligatoire"));
            if (r.getDepartureDateTime() != null && r.getArrivalDateTime() != null
                    && !r.getArrivalDateTime().isAfter(r.getDepartureDateTime())) {
                throw new BusinessException("L'arrivée doit être postérieure au départ");
            }
            f.setDepartureDateTime(r.getDepartureDateTime());
            f.setArrivalDateTime(r.getArrivalDateTime());
            boolean roundTrip = Boolean.TRUE.equals(r.getRoundTrip());
            f.setRoundTrip(roundTrip);
            f.setCabinClass(r.getCabinClass() == null || r.getCabinClass().isBlank() ? "ECONOMY" : r.getCabinClass().trim().toUpperCase());
            if (!List.of("ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST").contains(f.getCabinClass())) {
                throw new BusinessException("Classe de voyage invalide");
            }
            if (roundTrip) {
                if (r.getReturnDepartureDateTime() == null || r.getReturnArrivalDateTime() == null) {
                    throw new BusinessException("Les dates du vol retour sont obligatoires pour un aller-retour");
                }
                if (!r.getReturnDepartureDateTime().isAfter(r.getArrivalDateTime())
                        || !r.getReturnArrivalDateTime().isAfter(r.getReturnDepartureDateTime())) {
                    throw new BusinessException("Les dates du retour doivent suivre l'arrivée du vol aller");
                }
                f.setReturnDepartureDateTime(r.getReturnDepartureDateTime());
                f.setReturnArrivalDateTime(r.getReturnArrivalDateTime());
            } else {
                f.setReturnDepartureDateTime(null); f.setReturnArrivalDateTime(null);
            }
            if (!periods.isEmpty() && periods.stream().noneMatch(p -> !f.getDepartureDateTime().isBefore(p.getStartAt()) && !f.getDepartureDateTime().isAfter(p.getEndAt()))) {
                throw new BusinessException(com.agence.voyage.exception.ErrorCode.OFFER_NOT_AVAILABLE, "Une disponibilité doit couvrir le départ du vol aller");
            }
            if (roundTrip && !periods.isEmpty() && periods.stream().noneMatch(p -> !f.getReturnDepartureDateTime().isBefore(p.getStartAt()) && !f.getReturnDepartureDateTime().isAfter(p.getEndAt()))) {
                throw new BusinessException(com.agence.voyage.exception.ErrorCode.OFFER_NOT_AVAILABLE, "Une disponibilité doit couvrir le départ du vol retour");
            }
        } else if (offer instanceof Hotel h) {
            if (r.getStars() == null || r.getStars() < 1 || r.getStars() > 5) {
                throw new BusinessException("Le classement doit être compris entre 1 et 5 étoiles");
            }
            h.setStars(r.getStars());
            h.setRoomType(required(r.getRoomType(), "Le type de chambre est obligatoire"));
            h.setAddress(blankToNull(r.getAddress()));
        } else if (offer instanceof Car c) {
            if (r.getSeats() != null && r.getSeats() < 1) {
                throw new BusinessException("Le nombre de places doit être supérieur à 0");
            }
            c.setBrand(required(r.getBrand(), "La marque est obligatoire"));
            c.setModel(blankToNull(r.getModel()));
            c.setTransmission(blankToNull(r.getTransmission()));
            c.setSeats(r.getSeats());
            c.setPickupLocation(required(r.getPickupLocation(), "Le lieu de prise en charge est obligatoire"));
            c.setAllowsDifferentDropoff(Boolean.TRUE.equals(r.getAllowsDifferentDropoff()));
            List<String> dropoffLocations = cleanLocations(r.getDropoffLocations());
            // Compatibilité avec les anciens clients qui envoyaient un seul lieu.
            if (dropoffLocations.isEmpty() && r.getDropoffLocation() != null && !r.getDropoffLocation().isBlank()) {
                dropoffLocations = List.of(r.getDropoffLocation().trim());
            }
            if (c.getAllowsDifferentDropoff() && dropoffLocations.isEmpty()) {
                throw new BusinessException("Ajoutez au moins un lieu de restitution autorisé");
            }
            c.setDropoffLocations(c.getAllowsDifferentDropoff() ? dropoffLocations : List.of(c.getPickupLocation()));
            int minimumAge = r.getMinimumDriverAge() == null ? 21 : r.getMinimumDriverAge();
            int maximumAge = r.getMaximumDriverAge() == null ? 75 : r.getMaximumDriverAge();
            if (minimumAge < 18 || maximumAge > 99 || maximumAge < minimumAge) {
                throw new BusinessException("La plage d'âge du conducteur doit être comprise entre 18 et 99 ans");
            }
            c.setMinimumDriverAge(minimumAge);
            c.setMaximumDriverAge(maximumAge);
        } else if (offer instanceof TaxiTransfer t) {
            t.setPickupLocation(required(r.getPickupLocation(), "Le lieu de prise en charge est obligatoire"));
            t.setDropoffLocation(required(r.getDropoffLocation(), "Le lieu de dépose est obligatoire"));
            t.setVehicleType(blankToNull(r.getVehicleType()));
        } else if (offer instanceof Excursion e) {
            if (r.getDurationHours() == null || r.getDurationHours() < 1) {
                throw new BusinessException("La durée de l'excursion doit être d'au moins 1 heure");
            }
            e.setDurationHours(r.getDurationHours());
            e.setIncludesGuide(Boolean.TRUE.equals(r.getIncludesGuide()));
            e.setIncludesTransport(Boolean.TRUE.equals(r.getIncludesTransport()));
            e.setItinerary(blankToNull(r.getItinerary()));
        }
    }

    private City resolveCity(OfferRequest request) {
        if (request.getCityId() != null) {
            return cityRepository.findById(request.getCityId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Ville introuvable : id=" + request.getCityId()));
        }
        String name = required(request.getCityName(),
                "Recherchez puis sélectionnez une ville dans les suggestions");
        return resolveOrCreateCity(name, request);
    }

    private City resolveOrCreateCity(String name, OfferRequest request) {
        String normalized = com.agence.voyage.util.CityNormalizer.normalizeForComparison(name);
        java.util.Optional<City> existing = cityRepository.findByNormalizedName(normalized)
                .or(() -> cityRepository.findByNameIgnoreCase(name.trim()));
        if (existing.isPresent()) {
            City city = existing.get();
            boolean updated = false;
            if (city.getLatitude() == null && request.getCityLatitude() != null) {
                city.setLatitude(com.agence.voyage.util.CityNormalizer.roundCoordinate(request.getCityLatitude()));
                updated = true;
            }
            if (city.getLongitude() == null && request.getCityLongitude() != null) {
                city.setLongitude(com.agence.voyage.util.CityNormalizer.roundCoordinate(request.getCityLongitude()));
                updated = true;
            }
            if (Boolean.TRUE.equals(request.getCityHasAirport()) && !Boolean.TRUE.equals(city.getHasAirport())) {
                city.setHasAirport(true);
                updated = true;
            }
            if (updated) {
                cityRepository.save(city);
            }
            return city;
        }

        String country = (request.getCityCountry() != null && !request.getCityCountry().isBlank())
                ? request.getCityCountry().trim()
                : "Maroc";
        String countryCode = (request.getCityCountryCode() != null && !request.getCityCountryCode().isBlank())
                ? request.getCityCountryCode().trim().toUpperCase(java.util.Locale.ROOT)
                : "MA";
        Boolean hasAirport = Boolean.TRUE.equals(request.getCityHasAirport());

        City newCity = new City(
                name.trim(),
                com.agence.voyage.util.CityNormalizer.roundCoordinate(request.getCityLatitude()),
                com.agence.voyage.util.CityNormalizer.roundCoordinate(request.getCityLongitude()),
                country,
                countryCode,
                hasAirport
        );

        try {
            return cityRepository.saveAndFlush(newCity);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            return cityRepository.findByNormalizedName(normalized)
                    .or(() -> cityRepository.findByNameIgnoreCase(name.trim()))
                    .orElseThrow(() -> ex);
        }
    }

    private List<String> cleanImages(List<String> images) {
        List<String> cleaned = new ArrayList<>();
        if (images != null) {
            for (String image : images) {
                if (image != null && !image.isBlank()) {
                    cleaned.add(image.trim());
                }
            }
        }
        int maxAllowed = MAX_IMAGES;
        if (settingService != null) {
            int dynamicMax = settingService.getInt(SettingKeys.OFFERS_IMAGES_MAX);
            if (dynamicMax > 0) {
                maxAllowed = dynamicMax;
            }
        }
        if (cleaned.size() > maxAllowed) {
            throw new BusinessException("Une offre ne peut pas avoir plus de " + maxAllowed + " images");
        }
        return cleaned;
    }

    private static List<String> cleanLocations(List<String> locations) {
        if (locations == null) return new ArrayList<>();
        List<String> cleaned = locations.stream().filter(v -> v != null && !v.isBlank()).map(String::trim).distinct().toList();
        if (cleaned.size() > 20) throw new BusinessException("Une voiture ne peut pas avoir plus de 20 lieux de restitution");
        return new ArrayList<>(cleaned);
    }

    private static List<OfferAvailability> cleanAvailabilities(List<OfferRequest.AvailabilityInput> inputs) {
        if (inputs == null) return new ArrayList<>();
        List<OfferAvailability> result = new ArrayList<>();
        for (OfferRequest.AvailabilityInput input : inputs) {
            if (input.getStartAt() == null || input.getEndAt() == null || !input.getEndAt().isAfter(input.getStartAt())) {
                throw new BusinessException("Chaque disponibilité doit avoir une fin postérieure au début");
            }
            if (input.getCapacity() == null || input.getCapacity() < 0) {
                throw new BusinessException("La capacité d'une disponibilité ne peut pas être négative");
            }
            result.add(new OfferAvailability(input.getStartAt(), input.getEndAt(), input.getCapacity()));
        }
        result.sort(Comparator.comparing(OfferAvailability::getStartAt));
        for (int i=1; i<result.size(); i++) {
            if (result.get(i).getStartAt().isBefore(result.get(i-1).getEndAt())) {
                throw new BusinessException(com.agence.voyage.exception.ErrorCode.AVAILABILITY_OVERLAP, "Les périodes de disponibilité d'une offre ne doivent pas se chevaucher");
            }
        }
        return result;
    }

    private static String required(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BusinessException(message);
        }
        return value.trim();
    }

    public List<OfferTranslation> getTranslations(Long offerId) {
        if (offerTranslationRepository == null) return List.of();
        return offerTranslationRepository.findByOfferId(offerId);
    }

    @Transactional
    public OfferTranslation saveTranslation(Long offerId, String locale, com.agence.voyage.dto.OfferTranslationRequest req, Long userId, boolean isAdmin) {
        Offer offer = findById(offerId);
        if (!isAdmin && (offer.getSupplier() == null || !offer.getSupplier().getId().equals(userId))) {
            throw new ForbiddenException(com.agence.voyage.exception.ErrorCode.FORBIDDEN, "Seul le fournisseur propriétaire ou l'administrateur peut modifier les traductions de cette offre");
        }
        String cleanLocale = locale.trim().toLowerCase();
        if (!cleanLocale.equals("en") && !cleanLocale.equals("ar")) {
            throw new BusinessException("Langue de traduction non supportée : " + locale);
        }
        OfferTranslation translation = offerTranslationRepository.findByOfferIdAndLocale(offerId, cleanLocale)
                .orElse(new OfferTranslation(offer, cleanLocale, req.getTitle(), req.getDescription()));
        translation.setTitle(req.getTitle().trim());
        if (req.getDescription() != null) translation.setDescription(req.getDescription().trim());
        if (req.getItinerary() != null) translation.setItinerary(req.getItinerary().trim());
        return offerTranslationRepository.save(translation);
    }

    @Transactional
    public void deleteTranslation(Long offerId, String locale, Long userId, boolean isAdmin) {
        Offer offer = findById(offerId);
        if (!isAdmin && (offer.getSupplier() == null || !offer.getSupplier().getId().equals(userId))) {
            throw new ForbiddenException(com.agence.voyage.exception.ErrorCode.FORBIDDEN, "Seul le fournisseur propriétaire ou l'administrateur peut supprimer les traductions de cette offre");
        }
        if (offerTranslationRepository != null) {
            offerTranslationRepository.deleteByOfferIdAndLocale(offerId, locale.trim().toLowerCase());
        }
    }

    public OfferResponse toLocalizedResponse(Offer offer, String locale) {
        OfferResponse resp = OfferResponse.from(offer);
        if (offerTranslationRepository != null && offer != null) {
            List<OfferTranslation> translations = offerTranslationRepository.findByOfferId(offer.getId());
            List<String> langs = new ArrayList<>();
            langs.add("fr");
            for (OfferTranslation t : translations) {
                langs.add(t.getLocale());
                if (locale != null && locale.equalsIgnoreCase(t.getLocale())) {
                    resp.applyTranslation(t);
                }
            }
            resp.setAvailableLanguages(langs);
        }
        return resp;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
