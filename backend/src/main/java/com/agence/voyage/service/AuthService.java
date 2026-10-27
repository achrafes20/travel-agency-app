package com.agence.voyage.service;

import com.agence.voyage.dto.AuthResponse;
import com.agence.voyage.dto.LoginRequest;
import com.agence.voyage.dto.RegisterRequest;
import com.agence.voyage.dto.UserRequest;
import com.agence.voyage.dto.UserResponse;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.User;
import com.agence.voyage.exception.UnauthorizedException;
import com.agence.voyage.repository.UserRepository;
import com.agence.voyage.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, UserService userService,
                       PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /** Inscription publique : le rôle est toujours CLIENT, quoi que le navigateur envoie. */
    public AuthResponse register(RegisterRequest request) {
        UserRequest userRequest = new UserRequest();
        userRequest.setFullName(request.getFullName());
        userRequest.setEmail(request.getEmail());
        userRequest.setPassword(request.getPassword());
        userRequest.setRole(Role.CLIENT);
        return toResponse(userService.create(userRequest));
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.getEmail().trim())
                .filter(u -> passwordEncoder.matches(request.getPassword(), u.getPassword()))
                .orElseThrow(() -> new UnauthorizedException("Email ou mot de passe incorrect"));
        if (user.isArchived()) {
            throw new UnauthorizedException("Ce compte est désactivé");
        }
        return toResponse(user);
    }

    private AuthResponse toResponse(User user) {
        return new AuthResponse(jwtService.generateToken(user), UserResponse.from(user));
    }
}
