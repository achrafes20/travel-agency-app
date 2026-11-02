package com.agence.voyage.repository;
import com.agence.voyage.entity.BookingItemAllocation;
import org.springframework.data.jpa.repository.*;
import java.util.*;
public interface BookingAllocationRepository extends JpaRepository<BookingItemAllocation,Long> {
 @Query("select coalesce(sum(a.quantity),0) from BookingItemAllocation a where a.availability.id=:id and a.restored=false")
 long consumed(Long id);
 @Query("select a from BookingItemAllocation a join fetch a.availability where a.bookingItem.booking.id=:id and a.restored=false order by a.availability.id")
 List<BookingItemAllocation> outstanding(Long id);
}

