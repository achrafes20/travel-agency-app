package com.agence.voyage.repository;
import com.agence.voyage.entity.BookingSequence;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import java.util.Optional;
public interface BookingSequenceRepository extends JpaRepository<BookingSequence,Integer> {
 @Lock(LockModeType.PESSIMISTIC_WRITE)
 @Query("select s from BookingSequence s where s.year=:year")
 Optional<BookingSequence> lockYear(int year);
}

