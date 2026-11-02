package com.agence.voyage.repository;
import com.agence.voyage.entity.BookingItem;
import org.springframework.data.jpa.repository.*;
import java.util.*;
public interface BookingItemRepository extends JpaRepository<BookingItem,Long> {
 @EntityGraph(attributePaths={"offer","bundle","supplier","parentItem"})
 List<BookingItem> findByBookingIdIn(Collection<Long> ids);
}

