package com.agence.voyage.config;

import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.User;
import com.agence.voyage.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;

    public DataSeeder(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        userRepository.save(new User("Sarah Benali", "sarah.benali@example.com", "password123", Role.CLIENT));
        userRepository.save(new User("Karim Idrissi", "karim.idrissi@atlasvoyage.ma", "password123", Role.SUPPLIER));
        userRepository.save(new User("Nadia El Fassi", "nadia.elfassi@atlasvoyage.ma", "password123", Role.AGENT));
        userRepository.save(new User("Omar Tazi", "omar.tazi@atlasvoyage.ma", "password123", Role.ADMIN));
    }
}
