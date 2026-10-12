package com.agence.voyage.service;

import com.agence.voyage.dto.OfferRequest;
import com.agence.voyage.entity.Car;
import com.agence.voyage.entity.City;
import com.agence.voyage.entity.Excursion;
import com.agence.voyage.entity.Flight;
import com.agence.voyage.entity.Hotel;
import com.agence.voyage.entity.Offer;
import com.agence.voyage.entity.OfferType;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.TaxiTransfer;
import com.agence.voyage.entity.User;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.exception.ResourceNotFoundException;
import com.agence.voyage.repository.CityRepository;
import com.agence.voyage.repository.OfferRepository;
import com.agence.voyage.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class OfferService {

    private static final int MAX_IMAGES = 5;

    private final OfferRepository offerRepository;
    private final CityRepository cityRepository;
    private final UserRepository userRepository;

    public OfferService(OfferRepository offerRepository, CityRepository cityRepository, UserRepository userRepository) {
        this.offerRepository = offerRepository;
        this.cityRepository = cityRepository;
        this.userRepository = userRepository;
    }

    public List<Offer> findAll(Long supplierId, OfferType type) {
        List<Offer> offers = supplierId != null
                ? offerRepository.findBySupplierId(supplierId)
                : offerRepository.findAll();
        if (type == null) {
            return offers;
        }
        return offers.stream().filter(o -> typeOf(o) == type).toList();
    }

    public Offer findById(Long id) {
        return offerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Offre introuvable : id=" + id));
    }

    @Transactional
    public Offer create(OfferRequest request) {
        Offer offer = newInstance(request.getType());
        apply(offer, request);
        return offerRepository.save(offer);
    }

    @Transactional
    public Offer update(Long id, OfferRequest request) {
        Offer offer = findById(id);
        if (typeOf(offer) != request.getType()) {
            throw new BusinessException("Le type d'une offre ne peut pas être modifié");
        }
        apply(offer, request);
        return offerRepository.save(offer);
    }

    @Transactional
    public void delete(Long id) {
        Offer offer = findById(id);
        try {
            offerRepository.delete(offer);
            offerRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessException(
                    "Impossible de supprimer cette offre : elle est utilisée dans des paniers, bundles ou réservations. "
                            + "Désactivez-la à la place.");
        }
    }

    public static OfferType typeOf(Offer offer) {
        if (offer instanceof Flight) return OfferType.FLIGHT;
        if (offer instanceof Hotel) return OfferType.HOTEL;
        if (offer instanceof Car) return OfferType.CAR;
        if (offer instanceof TaxiTransfer) return OfferType.TAXI_TRANSFER;
        if (offer instanceof Excursion) return OfferType.EXCURSION;
        throw new IllegalStateException("Type d'offre inconnu : " + offer.getClass().getSimpleName());
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
        City city = cityRepository.findById(r.getCityId())
                .orElseThrow(() -> new ResourceNotFoundException("Ville introuvable : id=" + r.getCityId()));
        User supplier = userRepository.findById(r.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Fournisseur introuvable : id=" + r.getSupplierId()));
        if (supplier.getRole() != Role.SUPPLIER || supplier.isArchived()) {
            throw new BusinessException("L'utilisateur indiqué n'est pas un fournisseur actif");
        }

        offer.setTitle(r.getTitle().trim());
        offer.setDescription(blankToNull(r.getDescription()));
        offer.setBasePrice(r.getBasePrice());
        offer.setStock(r.getStock());
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

    private static List<String> cleanImages(List<String> images) {
        List<String> cleaned = new ArrayList<>();
        if (images != null) {
            for (String image : images) {
                if (image != null && !image.isBlank()) {
                    cleaned.add(image.trim());
                }
            }
        }
        if (cleaned.size() > MAX_IMAGES) {
            throw new BusinessException("Une offre ne peut pas avoir plus de " + MAX_IMAGES + " images");
        }
        return cleaned;
    }

    private static String required(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BusinessException(message);
        }
        return value.trim();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
