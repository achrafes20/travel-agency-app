package com.agence.voyage.repository;

import com.agence.voyage.entity.Offer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface OfferRepository extends JpaRepository<Offer, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select o from Offer o where o.id in :ids order by o.id")
    List<Offer> lockAll(Collection<Long> ids);

    List<Offer> findBySupplierId(Long supplierId);

    boolean existsByTitleIgnoreCase(String title);

    Optional<Offer> findByTitleIgnoreCase(String title);

    long countByCityId(Long cityId);
}
