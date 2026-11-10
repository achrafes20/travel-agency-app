package com.agence.voyage.profile;
import com.agence.voyage.security.PasswordPolicy;
import com.agence.voyage.exception.PasswordPolicyException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;
class PasswordPolicyTest {
    @ParameterizedTest @ValueSource(strings={"Ab!1","abcdefghij!1","ABCDEFGHIJ!1","Abcdefghij!","Abcdefghij12","Sarah!Voyage123","password123","12345678","azerty","qwerty"})
    void rejectsWeakOrIdentityPassword(String value){assertFalse(PasswordPolicy.violations(value,"sarah@example.com").isEmpty());assertThrows(PasswordPolicyException.class,()->PasswordPolicy.require(value,"sarah@example.com"));}
    @Test void limitsUtf8BytesRatherThanCharacters(){assertTrue(PasswordPolicy.violations("É".repeat(40)+"a!1","somebody@example.com").stream().anyMatch(s->s.contains("72")));}
    @Test void elevenCharactersNeverPassEvenWhenEveryOtherRuleIsMet(){
        String eleven="Qv7!mT2#kLp";
        assertEquals(11,eleven.length());
        assertTrue(PasswordPolicy.violations(eleven,"sarah@example.com").stream().anyMatch(s->s.contains("12")));
        assertThrows(PasswordPolicyException.class,()->PasswordPolicy.require(eleven,"sarah@example.com"));
        assertFalse(new com.agence.voyage.validation.StrongPasswordValidator().isValid(eleven,null));
        assertTrue(PasswordPolicy.violations(eleven+"9","sarah@example.com").isEmpty());
    }
    @Test void acceptsStrongAndReportsAllMissingRules(){assertTrue(PasswordPolicy.violations("Atlas!Voyage2026","sarah@example.com").isEmpty());assertTrue(PasswordPolicy.violations("",null).size()>=5);}
    @Test void productionNeverRegistersTokenLoggingTransport(){
        new org.springframework.boot.test.context.runner.ApplicationContextRunner()
            .withInitializer(c->c.getEnvironment().setActiveProfiles("prod"))
            .withUserConfiguration(com.agence.voyage.service.LoggingMailService.class,com.agence.voyage.service.DisabledProductionMailService.class)
            .run(c->{assertTrue(c.getBeansOfType(com.agence.voyage.service.LoggingMailService.class).isEmpty());assertEquals(1,c.getBeansOfType(com.agence.voyage.service.MailService.class).size());});
    }
}
