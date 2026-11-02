package com.agence.voyage.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.Min;

@Validated
@ConfigurationProperties("app.auth")
public class AuthAccountProperties {
    private boolean requireEmailVerification = false;
    @Min(1)
    private int resetTokenTtlMinutes = 30;
    @Min(1)
    private int verifyTokenTtlHours = 24;
    @Min(1)
    private int requestsPerWindow = 5;
    @Min(1)
    private int rateWindowMinutes = 15;

    public AuthAccountProperties() {}

    public AuthAccountProperties(boolean requireEmailVerification, int resetTokenTtlMinutes, int verifyTokenTtlHours, int requestsPerWindow, int rateWindowMinutes) {
        this.requireEmailVerification = requireEmailVerification;
        this.resetTokenTtlMinutes = resetTokenTtlMinutes;
        this.verifyTokenTtlHours = verifyTokenTtlHours;
        this.requestsPerWindow = requestsPerWindow;
        this.rateWindowMinutes = rateWindowMinutes;
    }

    public boolean requireEmailVerification() { return requireEmailVerification; }
    public boolean isRequireEmailVerification() { return requireEmailVerification; }
    public void setRequireEmailVerification(boolean requireEmailVerification) { this.requireEmailVerification = requireEmailVerification; }

    public int resetTokenTtlMinutes() { return resetTokenTtlMinutes; }
    public int getResetTokenTtlMinutes() { return resetTokenTtlMinutes; }
    public void setResetTokenTtlMinutes(int resetTokenTtlMinutes) { this.resetTokenTtlMinutes = resetTokenTtlMinutes; }

    public int verifyTokenTtlHours() { return verifyTokenTtlHours; }
    public int getVerifyTokenTtlHours() { return verifyTokenTtlHours; }
    public void setVerifyTokenTtlHours(int verifyTokenTtlHours) { this.verifyTokenTtlHours = verifyTokenTtlHours; }

    public int requestsPerWindow() { return requestsPerWindow; }
    public int getRequestsPerWindow() { return requestsPerWindow; }
    public void setRequestsPerWindow(int requestsPerWindow) { this.requestsPerWindow = requestsPerWindow; }

    public int rateWindowMinutes() { return rateWindowMinutes; }
    public int getRateWindowMinutes() { return rateWindowMinutes; }
    public void setRateWindowMinutes(int rateWindowMinutes) { this.rateWindowMinutes = rateWindowMinutes; }
}
