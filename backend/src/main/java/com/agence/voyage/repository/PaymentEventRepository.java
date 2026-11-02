package com.agence.voyage.repository;
import com.agence.voyage.entity.PaymentEvent;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.Repository;
import java.util.List;
/** Historique append-only : aucun contrat de modification/suppression. */
public interface PaymentEventRepository extends Repository<PaymentEvent,Long> {
 PaymentEvent save(PaymentEvent value);
 @EntityGraph(attributePaths="actor")
 List<PaymentEvent> findByPaymentIdOrderByIdAsc(Long paymentId);
 long countByPaymentId(Long paymentId);
}

