package com.agence.voyage.repository;

import com.agence.voyage.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Booking> {
    @Override
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths="client")
    org.springframework.data.domain.Page<Booking> findAll(org.springframework.data.jpa.domain.Specification<Booking> spec, org.springframework.data.domain.Pageable pageable);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select b from Booking b where b.id=:id")
    java.util.Optional<Booking> lockById(Long id);
    org.springframework.data.domain.Page<Booking> findByStatusAndExpiresAtBefore(com.agence.voyage.entity.BookingStatus status, java.time.LocalDateTime now, org.springframework.data.domain.Pageable pageable);
    org.springframework.data.domain.Page<Booking> findByStatusAndServiceEndAtBefore(com.agence.voyage.entity.BookingStatus status, java.time.LocalDateTime now, org.springframework.data.domain.Pageable pageable);
    boolean existsByNotes(String notes);

    boolean existsByPromoCodeId(Long promoCodeId);
}
