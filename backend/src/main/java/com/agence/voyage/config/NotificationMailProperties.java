package com.agence.voyage.config;
import org.springframework.boot.context.properties.*;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.*;
@Validated @ConfigurationProperties(prefix="app.mail")
public record NotificationMailProperties(@DefaultValue("false") boolean enabled,
 @DefaultValue("noreply@atlasvoyage.test") @NotBlank @Email String from,
 @DefaultValue("Atlas Voyage") @NotBlank String fromName) {
 @org.springframework.boot.context.properties.bind.ConstructorBinding
 public NotificationMailProperties {}
 public NotificationMailProperties(boolean enabled,String from){this(enabled,from,"Atlas Voyage");}
}
