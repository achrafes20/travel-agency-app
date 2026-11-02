package com.agence.voyage.repository;

import com.agence.voyage.entity.City;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CityRepository extends JpaRepository<City, Long> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    Optional<City> findByNameIgnoreCase(String name);

    Optional<City> findByNormalizedName(String normalizedName);

    boolean existsByNormalizedName(String normalizedName);

    boolean existsByNormalizedNameAndIdNot(String normalizedName, Long id);

    @Query("SELECT o.city.id, COUNT(o) FROM Offer o WHERE o.city IS NOT NULL GROUP BY o.city.id")
    List<Object[]> countOffersGroupedByCity();
}
