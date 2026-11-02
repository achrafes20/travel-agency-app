package com.agence.voyage.config;
import org.springframework.boot.context.properties.*;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.*;
@Validated @ConfigurationProperties(prefix="app.frontend")
public record FrontendProperties(@DefaultValue("http://127.0.0.1:5500/frontend")
 @Pattern(regexp="https?://[^\\s]+") String baseUrl) {}
