package com.agence.voyage.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
/** Marqueur indépendant du canal in-app : les e-mails sont aussi dédupliqués. */
@Entity @Table(name="notification_dispatches",uniqueConstraints=@UniqueConstraint(name="uk_notification_dispatch",columnNames={"user_id","dedup_key"}))
public class NotificationDispatch {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="user_id",nullable=false) private Long userId;
 @Column(name="dedup_key",length=200,nullable=false) private String dedupKey;
 @Column(nullable=false) private LocalDateTime createdAt;
 public NotificationDispatch(){}
 public NotificationDispatch(Long userId,String dedupKey,LocalDateTime at){this.userId=userId;this.dedupKey=dedupKey;createdAt=at;}
}
