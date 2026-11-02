package com.agence.voyage.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications", indexes={
 @jakarta.persistence.Index(name="idx_notification_user_read_created",columnList="user_id,is_read,created_at"),
 @jakarta.persistence.Index(name="idx_notification_user_created",columnList="user_id,created_at")},
 uniqueConstraints=@jakarta.persistence.UniqueConstraint(name="uk_notification_user_dedup",columnNames={"user_id","dedup_key"}))
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch=jakarta.persistence.FetchType.LAZY)
    @org.hibernate.annotations.OnDelete(action=org.hibernate.annotations.OnDeleteAction.CASCADE)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @jakarta.persistence.Enumerated(jakarta.persistence.EnumType.STRING)
    @Column(nullable=false,length=32)
    private NotificationType type=NotificationType.SYSTEM;
    @Column(nullable=false,length=150)
    private String title="Information Atlas Voyage";
    @Column(length=500)
    private String link;
    private LocalDateTime readAt;
    @Column(length=50)
    private String referenceType;
    private Long referenceId;
    @Column(length=200)
    private String dedupKey;
    public NotificationType getType(){return type;}
    public void setType(NotificationType value){type=value;}
    public String getTitle(){return title;}
    public void setTitle(String value){title=value;}
    public String getLink(){return link;}
    public void setLink(String value){link=value;}
    public LocalDateTime getReadAt(){return readAt;}
    public void setReadAt(LocalDateTime value){readAt=value;}
    public String getReferenceType(){return referenceType;}
    public void setReferenceType(String value){referenceType=value;}
    public Long getReferenceId(){return referenceId;}
    public void setReferenceId(Long value){referenceId=value;}
    public String getDedupKey(){return dedupKey;}
    public void setDedupKey(String value){dedupKey=value;}

    @Column(length = 1000, nullable = false)
    private String message;

    @Column(name="is_read",nullable = false)
    private Boolean isRead = false;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
