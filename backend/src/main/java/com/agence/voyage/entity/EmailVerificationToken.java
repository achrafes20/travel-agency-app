package com.agence.voyage.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity @Table(name="email_verification_tokens",indexes={@Index(name="idx_verification_user",columnList="user_id"),@Index(name="idx_verification_expiry",columnList="expires_at")})
public class EmailVerificationToken {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="user_id",nullable=false)
    @org.hibernate.annotations.OnDelete(action=org.hibernate.annotations.OnDeleteAction.CASCADE) public User user;
    @Column(nullable=false,unique=true,length=64) public String tokenHash;
    @Column(nullable=false) public LocalDateTime expiresAt,createdAt;
    public LocalDateTime usedAt;
}
