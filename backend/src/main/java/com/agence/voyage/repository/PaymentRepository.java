package com.agence.voyage.repository;

import com.agence.voyage.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Payment> {
    java.util.List<Payment> findByBookingIdOrderByIdAsc(Long bookingId);
    java.util.Optional<Payment> findByActiveBookingId(Long bookingId);
    java.util.Optional<Payment> findByProviderReference(String providerReference);
    boolean existsByBookingId(Long bookingId);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select p from Payment p where p.id=:id")
    java.util.Optional<Payment> lockById(Long id);
    @Override @org.springframework.data.jpa.repository.EntityGraph(attributePaths={"booking","client","collectedBy"})
    org.springframework.data.domain.Page<Payment> findAll(org.springframework.data.jpa.domain.Specification<Payment> spec,org.springframework.data.domain.Pageable pageable);
}
