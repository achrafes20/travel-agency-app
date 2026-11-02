package com.agence.voyage.repository;

import com.agence.voyage.entity.TicketSequence;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface TicketSequenceRepository extends JpaRepository<TicketSequence, Integer> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from TicketSequence s where s.year = :year")
    Optional<TicketSequence> lockYear(int year);
}

