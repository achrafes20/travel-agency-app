package com.agence.voyage.security;

import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/** Adapte l'entité {@link User} au modèle de Spring Security ; sert de principal dans les contrôleurs. */
public class AppUserDetails implements UserDetails {

    private final Long id;
    private final String email;
    private final String password;
    private final Role role;
    private final boolean archived;

    public AppUserDetails(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.password = user.getPassword();
        this.role = user.getRole();
        this.archived = user.isArchived();
    }

    public Long getId() {
        return id;
    }

    public Role getRole() {
        return role;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    /** Un compte archivé est désactivé : son jeton n'est plus accepté. */
    @Override
    public boolean isEnabled() {
        return !archived;
    }
}
