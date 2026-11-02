package com.agence.voyage.config;
import org.springframework.boot.context.properties.*;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.*;
@Validated @ConfigurationProperties(prefix="app.notifications")
public record NotificationProperties(@DefaultValue("20") @Min(1) @Max(100) int lowCapacityPercent,
 @DefaultValue("2") @Min(0) int lowCapacityUnits,@DefaultValue("3") @Min(0) int expiryWarningDays,
 @DefaultValue("90") @Min(1) int readRetentionDays,@DefaultValue("180") @Min(1) int retentionDays) {
 @AssertTrue(message="La rétention totale doit être au moins celle des notifications lues")
 public boolean isRetentionValid(){return retentionDays>=readRetentionDays;}
}
