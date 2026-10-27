package com.agence.voyage.service;

import com.agence.voyage.config.PasswordConfig;
import com.agence.voyage.dto.AuthResponse;
import com.agence.voyage.dto.LoginRequest;
import com.agence.voyage.dto.RegisterRequest;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.User;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.exception.UnauthorizedException;
import com.agence.voyage.repository.UserRepository;
import com.agence.voyage.security.JwtService;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
@ActiveProfiles("test")
@Import({AuthService.class, UserService.class, JwtService.class, PasswordConfig.class})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User supplier;

    @BeforeEach
    void setUp() {
        supplier = userRepository.save(
                new User("Karim", "karim@example.com", passwordEncoder.encode("password123"), Role.SUPPLIER));
    }

    private static LoginRequest login(String email, String password) {
        LoginRequest r = new LoginRequest();
        r.setEmail(email);
        r.setPassword(password);
        return r;
    }

    private static RegisterRequest registration(String name, String email, String password) {
        RegisterRequest r = new RegisterRequest();
        r.setFullName(name);
        r.setEmail(email);
        r.setPassword(password);
        return r;
    }

    @Test
    void login_returnsTokenWithUserIdAndRoleClaims() {
        AuthResponse response = authService.login(login("KARIM@example.com", "password123"));

        assertEquals(Role.SUPPLIER, response.getUser().getRole());
        Claims claims = jwtService.parse(response.getToken()).orElseThrow();
        assertEquals("karim@example.com", claims.getSubject());
        assertEquals("SUPPLIER", claims.get("role", String.class));
        assertEquals(supplier.getId(), claims.get("userId", Long.class));
    }

    @Test
    void login_rejectsWrongPasswordAndUnknownEmailWithTheSameMessage() {
        UnauthorizedException wrongPassword = assertThrows(UnauthorizedException.class,
                () -> authService.login(login("karim@example.com", "nope")));
        UnauthorizedException unknown = assertThrows(UnauthorizedException.class,
                () -> authService.login(login("ghost@example.com", "password123")));

        assertEquals(wrongPassword.getMessage(), unknown.getMessage());
    }

    @Test
    void login_rejectsArchivedAccount() {
        supplier.setArchived(true);
        userRepository.save(supplier);

        UnauthorizedException ex = assertThrows(UnauthorizedException.class,
                () -> authService.login(login("karim@example.com", "password123")));

        assertTrue(ex.getMessage().contains("désactivé"));
    }

    @Test
    void register_alwaysCreatesAClientWithHashedPassword() {
        AuthResponse response = authService.register(registration("Sarah", "sarah@example.com", "password123"));

        assertEquals(Role.CLIENT, response.getUser().getRole());
        User saved = userRepository.findByEmailIgnoreCase("sarah@example.com").orElseThrow();
        assertNotEquals("password123", saved.getPassword());
        assertTrue(passwordEncoder.matches("password123", saved.getPassword()));
        assertTrue(jwtService.parse(response.getToken()).isPresent());
    }

    @Test
    void register_rejectsDuplicateEmail() {
        assertThrows(BusinessException.class,
                () -> authService.register(registration("Autre", "KARIM@example.com", "password123")));
    }

    @Test
    void jwtService_rejectsTamperedToken() {
        String token = jwtService.generateToken(supplier);

        assertTrue(jwtService.parse(token).isPresent());
        int middle = token.length() - 10;
        char flipped = token.charAt(middle) == 'A' ? 'B' : 'A';
        String tampered = token.substring(0, middle) + flipped + token.substring(middle + 1);
        assertTrue(jwtService.parse(tampered).isEmpty());
        assertTrue(jwtService.parse("not-a-jwt").isEmpty());
    }
}
