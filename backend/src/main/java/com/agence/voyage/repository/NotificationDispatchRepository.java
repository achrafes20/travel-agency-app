package com.agence.voyage.repository;
import com.agence.voyage.entity.NotificationDispatch;
import org.springframework.data.jpa.repository.JpaRepository;
public interface NotificationDispatchRepository extends JpaRepository<NotificationDispatch,Long> {
 boolean existsByUserIdAndDedupKey(Long userId,String key);
}
