package com.agence.voyage.config;

import com.agence.voyage.entity.City;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.User;
import com.agence.voyage.repository.CityRepository;
import com.agence.voyage.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CityRepository cityRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public DataSeeder(UserRepository userRepository, CityRepository cityRepository) {
        this.userRepository = userRepository;
        this.cityRepository = cityRepository;
    }

    @Override
    public void run(String... args) {
        seedUsers();
        seedCities();
    }

    private void seedUsers() {
        if (userRepository.count() > 0) {
            return;
        }

        String encoded = passwordEncoder.encode("password123");
        userRepository.save(new User("Sarah Benali", "sarah.benali@example.com", encoded, Role.CLIENT));
        userRepository.save(new User("Karim Idrissi", "karim.idrissi@atlasvoyage.ma", encoded, Role.SUPPLIER));
        userRepository.save(new User("Nadia El Fassi", "nadia.elfassi@atlasvoyage.ma", encoded, Role.AGENT));
        userRepository.save(new User("Omar Tazi", "omar.tazi@atlasvoyage.ma", encoded, Role.ADMIN));
    }

    private void seedCities() {
        if (cityRepository.count() > 0) {
            return;
        }

        cityRepository.save(new City("Chefchaouen", 35.1688, -5.2697));
        cityRepository.save(new City("Marrakech", 31.6295, -7.9811));
        cityRepository.save(new City("Fès", 34.0181, -5.0078));
        cityRepository.save(new City("Essaouira", 31.5085, -9.7595));
        cityRepository.save(new City("Tanger", 35.7595, -5.8340));
    }
}
