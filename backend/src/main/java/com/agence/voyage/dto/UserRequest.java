package com.agence.voyage.dto;

import com.agence.voyage.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class UserRequest {

    @NotBlank(message = "Le nom complet est obligatoire")
    @Size(max = 120, message = "Le nom complet ne doit pas dépasser 120 caractères")
    private String fullName;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "L'email n'est pas valide")
    @Size(max = 180, message = "L'email ne doit pas dépasser 180 caractères")
    private String email;

    @NotNull(message = "Le rôle est obligatoire")
    private Role role;

    // Obligatoire à la création (vérifié dans UserService) ; vide ou absent en modification = inchangé.
    @Size(min = 8, max = 100, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String password;

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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
