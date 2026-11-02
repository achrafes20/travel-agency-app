package com.agence.voyage.dto;

import com.agence.voyage.validation.StrongPassword;
import jakarta.validation.constraints.*;

public final class AccountRequests {
    private AccountRequests(){}
    public record ChangePassword(
            @NotBlank @Size(max=1000) String currentPassword,
            @NotBlank @Size(max=128) @StrongPassword String newPassword,
            @NotBlank @Size(max=128) String confirmNewPassword){}

    public record ForgotPassword(
            @NotBlank @Email @Size(max=180) String email){}

    public record ResetPassword(
            @NotBlank @Size(max=128) String token,
            @NotBlank @Size(max=128) @StrongPassword String newPassword,
            @NotBlank @Size(max=128) String confirmNewPassword){}

    public record VerifyEmail(
            @NotBlank @Size(max=128) String token){}

    public record Message(String message){}
}
