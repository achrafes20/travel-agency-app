package com.agence.voyage.repository;

import com.agence.voyage.entity.OfferTranslation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OfferTranslationRepository extends JpaRepository<OfferTranslation, Long> {
    List<OfferTranslation> findByOfferId(Long offerId);
    Optional<OfferTranslation> findByOfferIdAndLocale(Long offerId, String locale);
    void deleteByOfferIdAndLocale(Long offerId, String locale);
    boolean existsByOfferIdAndLocale(Long offerId, String locale);
}

