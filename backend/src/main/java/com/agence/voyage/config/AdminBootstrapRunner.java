package com.agence.voyage.config;

import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.User;
import com.agence.voyage.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(1)
public class AdminBootstrapRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.bootstrap.email:${ADMIN_BOOTSTRAP_EMAIL:}}")
    private String bootstrapEmail;

    @Value("${admin.bootstrap.password:${ADMIN_BOOTSTRAP_PASSWORD:}}")
    private String bootstrapPassword;

    public AdminBootstrapRunner(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (bootstrapEmail != null && !bootstrapEmail.isBlank() &&
            bootstrapPassword != null && !bootstrapPassword.isBlank()) {
            boolean hasAdmin = userRepository.findAll().stream().anyMatch(u -> u.getRole() == Role.ADMIN);
            if (!hasAdmin) {
                User admin = new User("Administrateur Principal", bootstrapEmail.trim(),
                        passwordEncoder.encode(bootstrapPassword), Role.ADMIN);
                admin.setEmailVerified(true);
                userRepository.save(admin);
                log.info("admin_bootstrapped email={}", bootstrapEmail);
            }
        }
    }
}

