package com.agence.voyage.repository;

import com.agence.voyage.entity.Favorite;
import com.agence.voyage.entity.Offer;
import com.agence.voyage.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    Page<Favorite> findByClient(User client, Pageable pageable);

    List<Favorite> findByClient(User client);

    void deleteByClient(User client);

    boolean existsByClientAndOffer(User client, Offer offer);

    Optional<Favorite> findByClientAndOffer(User client, Offer offer);

    void deleteByClientAndOffer(User client, Offer offer);

    void deleteByOffer(Offer offer);

    long countByClient(User client);

    @Query("SELECT f.offer.id FROM Favorite f WHERE f.client.id = :clientId")
    List<Long> findOfferIdsByClientId(@Param("clientId") Long clientId);
}

