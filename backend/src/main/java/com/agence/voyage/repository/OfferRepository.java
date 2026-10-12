package com.agence.voyage.repository;

import com.agence.voyage.entity.Offer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OfferRepository extends JpaRepository<Offer, Long> {

    List<Offer> findBySupplierId(Long supplierId);
}
