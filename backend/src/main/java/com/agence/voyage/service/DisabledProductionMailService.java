package com.agence.voyage.service;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
@Service @Profile("prod") @ConditionalOnProperty(name="app.mail.enabled",havingValue="false",matchIfMissing=true)
public class DisabledProductionMailService implements MailService {
    @Override public void send(String to,String subject,String html,String text){org.slf4j.LoggerFactory.getLogger(getClass()).warn("account_mail_disabled");}
}
