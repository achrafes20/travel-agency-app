package com.agence.voyage.service;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
/** Développement uniquement : lien de test demandé explicitement, jamais en production. */
@Service @Profile("!prod") @ConditionalOnProperty(name="app.mail.enabled",havingValue="false",matchIfMissing=true)
public class LoggingMailService implements MailService {
    private static final org.slf4j.Logger log=org.slf4j.LoggerFactory.getLogger(LoggingMailService.class);
    @Override public void send(String to,String subject,String html,String text){log.info("DEV ACCOUNT MAIL to={} subject={}\n{}\n{}",to,subject,text,html);}
}
