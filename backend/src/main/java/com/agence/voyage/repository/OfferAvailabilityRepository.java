package com.agence.voyage.repository;
import com.agence.voyage.entity.OfferAvailability;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import java.util.*;
public interface OfferAvailabilityRepository extends JpaRepository<OfferAvailability,Long> {
 @Query("select o,a from Offer o join o.availabilities a where o.active=true and o.supplier.archived=false order by a.id")
 List<Object[]> alertCandidates(org.springframework.data.domain.Pageable pageable);
 @Lock(LockModeType.PESSIMISTIC_WRITE)
 @Query("select a from OfferAvailability a where a.id in :ids order by a.id")
 List<OfferAvailability> lockAll(Collection<Long> ids);
}

