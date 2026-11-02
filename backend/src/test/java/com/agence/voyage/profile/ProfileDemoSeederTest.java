package com.agence.voyage.profile;

import com.agence.voyage.config.ProfileDemoSeeder;
import com.agence.voyage.entity.*;
import com.agence.voyage.repository.*;
import java.time.*;
import java.util.List;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProfileDemoSeederTest {
    @Test void restartPreservesRevocationsAndFieldsExplicitlyClearedByUser() {
        var users=mock(UserRepository.class);
        var profiles=mock(SupplierProfileRepository.class);
        var cities=mock(CityRepository.class);
        var clock=Clock.fixed(Instant.parse("2026-10-31T12:00:00Z"),ZoneOffset.UTC);
        var user=new User("Sarah Benali","sarah.benali@example.com","unchanged-hash",Role.CLIENT);
        user.setCreatedAt(LocalDateTime.now(clock));user.setUpdatedAt(user.getCreatedAt());
        user.setTokenVersion(7);
        when(users.findAll()).thenReturn(List.of(user));when(cities.findAll()).thenReturn(List.of());
        var seeder=new ProfileDemoSeeder(users,profiles,cities,clock);
        seeder.run();assertEquals("MA",user.getCountry());assertNotNull(user.getPhone());
        user.setCountry(null);user.setPhone(null);user.setFullName("Nom personnel");
        user.setUpdatedAt(user.getCreatedAt().plusHours(1));
        seeder.run();
        assertNull(user.getPhone());assertNull(user.getCountry());assertEquals(7,user.getTokenVersion());
        assertEquals("Nom personnel",user.getFullName());assertEquals("unchanged-hash",user.getPassword());
    }
}
