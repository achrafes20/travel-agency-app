package com.agence.voyage.service;

import com.agence.voyage.dto.CityRequest;
import com.agence.voyage.dto.CityResponse;
import com.agence.voyage.entity.City;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.exception.ErrorCode;
import com.agence.voyage.exception.ResourceNotFoundException;
import com.agence.voyage.repository.CityRepository;
import com.agence.voyage.repository.OfferRepository;
import com.agence.voyage.util.CityNormalizer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class CityService {
    private static final Logger log = LoggerFactory.getLogger(CityService.class);

    private final CityRepository cityRepository;
    private final OfferRepository offerRepository;
    @Autowired(required = false)
    private com.agence.voyage.repository.CityTranslationRepository cityTranslationRepository;

    @Autowired
    public CityService(CityRepository cityRepository, @Nullable OfferRepository offerRepository) {
        this.cityRepository = cityRepository;
        this.offerRepository = offerRepository;
    }

    public CityService(CityRepository cityRepository) {
        this(cityRepository, null);
    }

    public List<City> findAll() {
        log.debug("list resource=city");
        return cityRepository.findAll();
    }

    public List<CityResponse> findAllResponses() {
        return findAllResponses(null);
    }

    public List<CityResponse> findAllResponses(String locale) {
        log.debug("list resource=city-responses locale={}", locale);
        List<City> cities = cityRepository.findAll();
        Map<Long, Long> counts = getOfferCountsPerCity();
        List<CityResponse> list = cities.stream()
                .map(c -> CityResponse.from(c, counts.getOrDefault(c.getId(), 0L)))
                .toList();

        if (locale != null && !locale.isBlank() && !locale.equalsIgnoreCase("fr")) {
            String cleanLoc = locale.trim().toLowerCase();
            for (CityResponse resp : list) {
                if (cityTranslationRepository != null) {
                    cityTranslationRepository.findByCityIdAndLocale(resp.getId(), cleanLoc)
                            .ifPresent(tr -> resp.setLocalizedName(tr.getName()));
                }
                if (resp.getLocalizedName().equals(resp.getName())) {
                    String known = getKnownCityTranslation(resp.getName(), cleanLoc);
                    if (known != null) resp.setLocalizedName(known);
                }
            }
        }
        return list;
    }

    public static String getKnownCityTranslation(String cityName, String locale) {
        if (cityName == null) return null;
        String norm = cityName.trim().toLowerCase();
        if (locale.equals("ar")) {
            if (norm.contains("marrakech")) return "مراكش";
            if (norm.contains("fes") || norm.contains("fès")) return "فاس";
            if (norm.contains("casablanca")) return "الدار البيضاء";
            if (norm.contains("tanger")) return "طنجة";
            if (norm.contains("agadir")) return "أكادير";
            if (norm.contains("rabat")) return "الرباط";
            if (norm.contains("essaouira")) return "الصويرة";
            if (norm.contains("chefchaouen")) return "شفشاون";
            if (norm.contains("ouarzazate")) return "ورزازات";
            if (norm.contains("merzouga")) return "مرزوكة";
            if (norm.contains("tetouan") || norm.contains("tétouan")) return "تطوان";
            if (norm.contains("dakhla")) return "الداخلة";
            if (norm.contains("meknes") || norm.contains("meknès")) return "مكناس";
        } else if (locale.equals("en")) {
            if (norm.contains("fes") || norm.contains("fès")) return "Fes";
            if (norm.contains("tanger")) return "Tangier";
            if (norm.contains("tetouan") || norm.contains("tétouan")) return "Tetouan";
            if (norm.contains("meknes") || norm.contains("meknès")) return "Meknes";
        }
        return null;
    }

    public City findById(Long id) {
        return cityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ville introuvable : id=" + id));
    }

    public CityResponse findResponseById(Long id) {
        City city = findById(id);
        long count = (offerRepository != null) ? offerRepository.countByCityId(id) : 0L;
        return CityResponse.from(city, count);
    }

    @Transactional
    public City create(CityRequest request) {
        String rawName = request.getName().trim();
        String normalized = CityNormalizer.normalizeForComparison(rawName);

        if (cityRepository.existsByNormalizedName(normalized) || cityRepository.existsByNameIgnoreCase(rawName)) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "Une ville avec ce nom existe déjà : " + rawName);
        }

        City city = new City(
                rawName,
                CityNormalizer.roundCoordinate(request.getLatitude()),
                CityNormalizer.roundCoordinate(request.getLongitude()),
                request.getCountry(),
                request.getCountryCode(),
                request.getHasAirport()
        );

        try {
            return cityRepository.save(city);
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "Une ville avec ce nom existe déjà : " + rawName);
        }
    }

    @Transactional
    public City update(Long id, CityRequest request) {
        City city = findById(id);
        String rawName = request.getName().trim();
        String normalized = CityNormalizer.normalizeForComparison(rawName);

        if (cityRepository.existsByNormalizedNameAndIdNot(normalized, id)
                || cityRepository.existsByNameIgnoreCaseAndIdNot(rawName, id)) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "Une ville avec ce nom existe déjà : " + rawName);
        }

        city.setName(rawName);
        city.setNormalizedName(normalized);
        city.setLatitude(CityNormalizer.roundCoordinate(request.getLatitude()));
        city.setLongitude(CityNormalizer.roundCoordinate(request.getLongitude()));
        if (request.getCountry() != null && !request.getCountry().isBlank()) {
            city.setCountry(request.getCountry().trim());
        }
        if (request.getCountryCode() != null && !request.getCountryCode().isBlank()) {
            city.setCountryCode(request.getCountryCode().trim().toUpperCase(Locale.ROOT));
        }
        if (request.getHasAirport() != null) {
            city.setHasAirport(request.getHasAirport());
        }

        try {
            return cityRepository.save(city);
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "Une ville avec ce nom existe déjà : " + rawName);
        }
    }

    @Transactional
    public void delete(Long id) {
        if (!cityRepository.existsById(id)) {
            throw new ResourceNotFoundException("Ville introuvable : id=" + id);
        }

        if (offerRepository != null && offerRepository.countByCityId(id) > 0) {
            throw new BusinessException(ErrorCode.CONFLICT, HttpStatus.CONFLICT,
                    "Impossible de supprimer cette ville : elle est utilisée par des offres");
        }

        try {
            cityRepository.deleteById(id);
            cityRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessException(ErrorCode.CONFLICT, HttpStatus.CONFLICT,
                    "Impossible de supprimer cette ville : elle est utilisée par des offres");
        }
    }

    private Map<Long, Long> getOfferCountsPerCity() {
        Map<Long, Long> counts = new HashMap<>();
        try {
            List<Object[]> rows = cityRepository.countOffersGroupedByCity();
            if (rows != null) {
                for (Object[] row : rows) {
                    if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                        Long cityId = ((Number) row[0]).longValue();
                        Long count = ((Number) row[1]).longValue();
                        counts.put(cityId, count);
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Could not retrieve grouped offer counts for cities: {}", ex.getMessage());
        }
        return counts;
    }
}
