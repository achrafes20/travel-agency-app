package com.agence.voyage.service;

import com.agence.voyage.dto.UserRequest;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.User;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DataJpaTest
@ActiveProfiles("test")
@Import(UserService.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
class UserServiceTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    private static UserRequest request(String name, String email, Role role, String password) {
        UserRequest r = new UserRequest();
        r.setFullName(name);
        r.setEmail(email);
        r.setRole(role);
        r.setPassword(password);
        return r;
    }

    @Test
    void create_rejectsDuplicateEmail() {
        userService.create(request("Sara", "sara@example.com", Role.CLIENT, "password123"));

        UserRequest duplicate = request("Autre", "SARA@example.com", Role.AGENT, "password123");

        assertThrows(BusinessException.class, () -> userService.create(duplicate));
        assertEquals(1, userRepository.count());
    }

    @Test
    void create_hashesPasswordAndRequiresOne() {
        User user = userService.create(request("Sara", "sara@example.com", Role.CLIENT, "password123"));

        assertNotEquals("password123", user.getPassword());
        assertThrows(BusinessException.class,
                () -> userService.create(request("Ali", "ali@example.com", Role.CLIENT, null)));
    }

    @Test
    void update_keepsPasswordWhenBlank() {
        User user = userService.create(request("Sara", "sara@example.com", Role.CLIENT, "password123"));
        String hash = user.getPassword();

        User updated = userService.update(user.getId(), request("Sara B.", "sara@example.com", Role.AGENT, null));

        assertEquals(hash, updated.getPassword());
        assertEquals(Role.AGENT, updated.getRole());
        assertEquals("Sara B.", updated.getFullName());
    }

    @Test
    void archive_restore_andDeleteRequiresArchived() {
        User user = userService.create(request("Sara", "sara@example.com", Role.CLIENT, "password123"));
        assertFalse(user.isArchived());
        assertThrows(BusinessException.class, () -> userService.delete(user.getId()));

        assertTrue(userService.archive(user.getId()).isArchived());
        assertFalse(userService.restore(user.getId()).isArchived());

        userService.archive(user.getId());
        userService.delete(user.getId());
        assertEquals(0, userRepository.count());
    }

    @Test
    void update_rejectsEmailTakenByAnotherUser() {
        userService.create(request("Sara", "sara@example.com", Role.CLIENT, "password123"));
        User other = userService.create(request("Ali", "ali@example.com", Role.CLIENT, "password123"));

        assertThrows(BusinessException.class,
                () -> userService.update(other.getId(), request("Ali", "sara@example.com", Role.CLIENT, null)));
    }
}
