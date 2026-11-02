package com.agence.voyage.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;
import java.util.List;

@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        @Valid @DefaultValue BookingProperties booking,
        @Valid @DefaultValue Currency currency,
        @Valid @DefaultValue Cors cors,
        @Valid @DefaultValue Jwt jwt,
        @Valid @DefaultValue Seed seed) {
    public record Currency(@DefaultValue("MAD") @Pattern(regexp = "MAD") String reference) {}
    public record Cors(@NotEmpty List<@NotBlank String> allowedOrigins) {}
    public record Jwt(@NotBlank String secret, @DefaultValue("86400000") @Positive long expirationMs) {}
    public record Seed(@DefaultValue("false") boolean enabled, @DefaultValue("") String password, @DefaultValue("false") boolean extended) {
        @AssertTrue(message = "app.seed.password est obligatoire quand le seeder est activé")
        public boolean isPasswordConfigured() { return !enabled || (password != null && password.length() >= 8); }
    }
}
