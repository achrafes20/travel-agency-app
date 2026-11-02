package com.agence.voyage.repository;
import com.agence.voyage.entity.IdempotencyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface IdempotencyRecordRepository extends JpaRepository<IdempotencyRecord,Long> {
 @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
 Optional<IdempotencyRecord> findByUserIdAndKey(Long userId,String key);
 @org.springframework.data.jpa.repository.Query("select i from IdempotencyRecord i where i.user.id=:userId and i.key=:key")
 Optional<IdempotencyRecord> readResponse(Long userId,String key);
}

