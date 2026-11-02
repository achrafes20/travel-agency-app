package com.agence.voyage.config;
import org.springframework.boot.context.properties.*;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.*;
@Validated @ConfigurationProperties("app.upload")
public record UploadProperties(@DefaultValue("5242880") @Min(1024) @Max(52428800) long maxSizeBytes,
    @DefaultValue("200") @Min(1) int maxTempFiles,@DefaultValue("20000000") @Min(40000) long maxPixels,
    @DefaultValue("2") @Min(1) @Max(8) int maxConcurrent){}
