package com.agence.voyage.repository;

import com.agence.voyage.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Notification> {
 java.util.Optional<Notification> findByIdAndUserId(Long id,Long userId);
 long countByUserIdAndIsReadFalse(Long userId);
 boolean existsByUserIdAndDedupKey(Long userId,String key);
 @org.springframework.data.jpa.repository.Modifying(clearAutomatically=true)
 @org.springframework.data.jpa.repository.Query("update Notification n set n.isRead=true,n.readAt=:at where n.user.id=:userId and n.isRead=false")
 int markAll(Long userId,java.time.LocalDateTime at);
 @org.springframework.data.jpa.repository.Modifying
 @org.springframework.data.jpa.repository.Query("delete from Notification n where n.createdAt<:allBefore or (n.isRead=true and n.createdAt<:readBefore)")
 int purge(java.time.LocalDateTime allBefore,java.time.LocalDateTime readBefore);
}
