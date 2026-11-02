package com.agence.voyage.repository;

import com.agence.voyage.entity.CityTranslation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CityTranslationRepository extends JpaRepository<CityTranslation, Long> {
    List<CityTranslation> findByCityId(Long cityId);
    Optional<CityTranslation> findByCityIdAndLocale(Long cityId, String locale);
    List<CityTranslation> findByLocale(String locale);
}

