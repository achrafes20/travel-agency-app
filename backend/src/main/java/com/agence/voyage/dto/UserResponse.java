package com.agence.voyage.dto;

import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.User;

public class UserResponse {

    private Long id;
    private String fullName;
    private String email;
    private Role role;
    private boolean archived;

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
        return new UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole(), user.isArchived());
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
}
