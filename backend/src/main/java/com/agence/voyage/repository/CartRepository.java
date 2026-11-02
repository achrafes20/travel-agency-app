package com.agence.voyage.repository;

import com.agence.voyage.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select c from Cart c where c.client.id=:id")
    Optional<Cart> lockByClientId(Long id);

    Optional<Cart> findByClientId(Long clientId);

    List<Cart> findByPromoCodeId(Long promoCodeId);
}
