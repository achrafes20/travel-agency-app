package com.agence.voyage.repository;

import com.agence.voyage.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {

    Optional<Cart> findByClientId(Long clientId);

    List<Cart> findByPromoCodeId(Long promoCodeId);
}
