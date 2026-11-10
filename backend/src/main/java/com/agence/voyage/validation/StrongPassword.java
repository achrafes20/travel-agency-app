package com.agence.voyage.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = StrongPasswordValidator.class)
@Target({ElementType.METHOD, ElementType.FIELD, ElementType.ANNOTATION_TYPE, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface StrongPassword {
    String message() default "Le mot de passe ne respecte pas les critères de sécurité";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
    int min() default com.agence.voyage.security.PasswordPolicy.MIN_LENGTH;
    int max() default com.agence.voyage.security.PasswordPolicy.MAX_LENGTH;
}

