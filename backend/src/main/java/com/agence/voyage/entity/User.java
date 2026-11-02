package com.agence.voyage.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users",indexes=@jakarta.persistence.Index(name="idx_user_role_created",columnList="role,created_at"))
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;

    @Column(unique = true)
    private String email;

    @JsonIgnore
    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Enumerated(EnumType.STRING)
    private OfferType supplierCategory;

    private boolean archived;
    @Column(length=20) private String phone;
    @Column(length=2) private String country;
    @Column(length=500) private String avatarUrl;
    @Column(nullable=false) private boolean emailVerified;
    @JsonIgnore @Column(nullable=false) private long tokenVersion;
    @JsonIgnore private java.time.LocalDateTime passwordChangedAt;
    @Column(nullable=false) private java.time.LocalDateTime updatedAt=java.time.LocalDateTime.now(java.time.ZoneOffset.UTC);
    public String getPhone(){return phone;}
    public void setPhone(String value){phone=value;}
    public String getCountry(){return country;}
    public void setCountry(String value){country=value;}
    public String getAvatarUrl(){return avatarUrl;}
    public void setAvatarUrl(String value){avatarUrl=value;}
    public boolean isEmailVerified(){return emailVerified;}
    public void setEmailVerified(boolean value){emailVerified=value;}
    public long getTokenVersion(){return tokenVersion;}
    public void setTokenVersion(long value){tokenVersion=value;}
    public java.time.LocalDateTime getPasswordChangedAt(){return passwordChangedAt;}
    public void setPasswordChangedAt(java.time.LocalDateTime value){passwordChangedAt=value;}
    public java.time.LocalDateTime getUpdatedAt(){return updatedAt;}
    public void setUpdatedAt(java.time.LocalDateTime value){updatedAt=value;}
    @Column(nullable=false)
    private java.time.LocalDateTime createdAt=java.time.LocalDateTime.now(java.time.ZoneOffset.UTC);
    @Column(nullable=false)
    private boolean createdAtEstimated;
    public java.time.LocalDateTime getCreatedAt(){return createdAt;}
    public void setCreatedAt(java.time.LocalDateTime value){createdAt=value;}
    public boolean isCreatedAtEstimated(){return createdAtEstimated;}
    @Column(nullable = false)
    private int failedLoginAttempts = 0;

    private java.time.LocalDateTime lockedUntil;

    private java.time.LocalDateTime consentAt;

    @Column(length = 50)
    private String consentVersion;

    @Column(length = 5)
    private String preferredLanguage = "fr";

    @Column(length = 5)
    private String preferredCurrency = "MAD";

    public String getPreferredLanguage() { return preferredLanguage; }
    public void setPreferredLanguage(String preferredLanguage) { this.preferredLanguage = preferredLanguage; }
    public String getPreferredCurrency() { return preferredCurrency; }
    public void setPreferredCurrency(String preferredCurrency) { this.preferredCurrency = preferredCurrency; }

    @Column(nullable = false)
    private boolean marketingOptIn = false;

    public int getFailedLoginAttempts() { return failedLoginAttempts; }
    public void setFailedLoginAttempts(int failedLoginAttempts) { this.failedLoginAttempts = failedLoginAttempts; }
    public java.time.LocalDateTime getLockedUntil() { return lockedUntil; }
    public void setLockedUntil(java.time.LocalDateTime lockedUntil) { this.lockedUntil = lockedUntil; }
    public java.time.LocalDateTime getConsentAt() { return consentAt; }
    public void setConsentAt(java.time.LocalDateTime consentAt) { this.consentAt = consentAt; }
    public String getConsentVersion() { return consentVersion; }
    public void setConsentVersion(String consentVersion) { this.consentVersion = consentVersion; }
    public boolean isMarketingOptIn() { return marketingOptIn; }
    public void setMarketingOptIn(boolean marketingOptIn) { this.marketingOptIn = marketingOptIn; }

    public void setCreatedAtEstimated(boolean value){createdAtEstimated=value;}

    public User() {
    }

    public User(String fullName, String email, String password, Role role) {
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public OfferType getSupplierCategory() { return supplierCategory; }
    public void setSupplierCategory(OfferType supplierCategory) { this.supplierCategory = supplierCategory; }

    public boolean isArchived() {
        return archived;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
    }
}
