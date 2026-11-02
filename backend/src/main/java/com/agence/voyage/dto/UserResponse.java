package com.agence.voyage.dto;

import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.User;
import com.agence.voyage.entity.OfferType;

public class UserResponse {

    private Long id;
    private String fullName;
    private String email;
    private Role role;
    private boolean archived;
    private OfferType supplierCategory;
    private String phone,country,avatarUrl;
    private String preferredLanguage;
    private String preferredCurrency;
    public String getPreferredLanguage(){return preferredLanguage;}
    public String getPreferredCurrency(){return preferredCurrency;}
    private boolean emailVerified;
    private java.time.LocalDateTime createdAt,updatedAt,passwordChangedAt;
    public String getPhone(){return phone;}
    public String getCountry(){return country;}
    public String getAvatarUrl(){return avatarUrl;}
    public boolean isEmailVerified(){return emailVerified;}
    public java.time.LocalDateTime getCreatedAt(){return createdAt;}
    public java.time.LocalDateTime getUpdatedAt(){return updatedAt;}
    public java.time.LocalDateTime getPasswordChangedAt(){return passwordChangedAt;}

    public UserResponse() {
    }

    public UserResponse(Long id, String fullName, String email, Role role, boolean archived) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.archived = archived;
    }

    public static UserResponse from(User user) {
        UserResponse response = new UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole(), user.isArchived());
        response.supplierCategory = user.getSupplierCategory();
        response.phone=user.getPhone();response.country=user.getCountry();response.avatarUrl=user.getAvatarUrl();
        response.emailVerified=user.isEmailVerified();response.createdAt=user.getCreatedAt();response.updatedAt=user.getUpdatedAt();
        response.passwordChangedAt=user.getPasswordChangedAt();
        response.preferredLanguage = user.getPreferredLanguage();
        response.preferredCurrency = user.getPreferredCurrency();
        return response;
    }

    public boolean isArchived() {
        return archived;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
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

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
    public OfferType getSupplierCategory() { return supplierCategory; }
    public void setSupplierCategory(OfferType supplierCategory) { this.supplierCategory = supplierCategory; }
}
