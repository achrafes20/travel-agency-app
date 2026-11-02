package com.agence.voyage.config;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.*;
@Validated @ConfigurationProperties("app.storage")
public record StorageProperties(@DefaultValue("local") @Pattern(regexp="local") String type,
    @DefaultValue Local local,@DefaultValue("http://localhost:8080") @NotBlank String publicBaseUrl){
    public record Local(@DefaultValue("./uploads") @NotBlank String root){}
}
