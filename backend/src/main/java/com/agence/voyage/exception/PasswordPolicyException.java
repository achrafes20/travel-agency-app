package com.agence.voyage.exception;
import java.util.List;
public class PasswordPolicyException extends BusinessException {
    private final List<String> rules;
    public PasswordPolicyException(List<String> rules){super(ErrorCode.PASSWORD_POLICY_VIOLATION,"Le mot de passe ne respecte pas toutes les règles");this.rules=List.copyOf(rules);}
    public List<String> getRules(){return rules;}
}
