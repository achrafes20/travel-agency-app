package com.agence.voyage.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name="file_assets",indexes={@Index(name="idx_file_owner_status",columnList="owner_id,status"),@Index(name="idx_file_status_created",columnList="status,created_at")})
public class FileAsset {
    public enum Status { TEMP, ATTACHED }
    @Id @Column(length=36) public String id=UUID.randomUUID().toString();
    @Column(nullable=false,unique=true,length=45) public String storedName;
    @Column(nullable=false,unique=true,length=45) public String thumbnailName;
    @Column(nullable=false) public long originalSize,storedSize;
    @Column(nullable=false) public int width,height;
    @Column(nullable=false,length=30) public String contentType;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=24) public FilePurpose purpose;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="owner_id",nullable=false)
    @org.hibernate.annotations.OnDelete(action=org.hibernate.annotations.OnDeleteAction.CASCADE) public User owner;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=12) public Status status=Status.TEMP;
    @Column(nullable=false) public LocalDateTime createdAt;
    public LocalDateTime attachedAt;
    public LocalDateTime orphanedAt;
    /** Une seule ressource peut rattacher un asset : avatar, logo ou offre. */
    @Column(length=80) public String attachmentKey;
}
