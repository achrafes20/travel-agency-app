package com.agence.voyage.dto;

import com.agence.voyage.validation.StrongPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

    @NotBlank(message = "Le nom complet est obligatoire")
    @Size(max = 120, message = "Le nom complet ne doit pas dépasser 120 caractères")
    private String fullName;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "L'email n'est pas valide")
    @Size(max = 180, message = "L'email ne doit pas dépasser 180 caractères")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(max = 128, message = "Le champ mot de passe ne doit pas dépasser 128 caractères")
    private String password;

    private boolean marketingOptIn = false;

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

    public boolean isMarketingOptIn() {
        return marketingOptIn;
    }

    public void setMarketingOptIn(boolean marketingOptIn) {
        this.marketingOptIn = marketingOptIn;
    }
}
