package com.agence.voyage.validation;

import com.agence.voyage.security.PasswordPolicy;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.List;

public class StrongPasswordValidator implements ConstraintValidator<StrongPassword, String> {

    private int min = 12;
    private int max = 128;

    @Override
    public void initialize(StrongPassword annotation) {
        this.min = annotation.min();
        this.max = annotation.max();
    }

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null || password.isBlank()) {
            return true; // Laisser @NotBlank gérer l'obligation si requise
        }

        List<String> violations = PasswordPolicy.violations(password, null, null, min, max);
        if (violations.isEmpty()) {
            return true;
        }

        if (context != null) {
            context.disableDefaultConstraintViolation();
            for (String msg : violations) {
                context.buildConstraintViolationWithTemplate(msg).addConstraintViolation();
            }
        }
        return false;
    }
}
