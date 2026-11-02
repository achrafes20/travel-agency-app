package com.agence.voyage.service;
import com.agence.voyage.config.NotificationMailProperties;
import org.springframework.stereotype.Service;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.javamail.*;
@Service @ConditionalOnProperty(name="app.mail.enabled",havingValue="true")
public class SmtpMailService implements MailService {
    private final JavaMailSender sender;private final NotificationMailProperties properties;
    public SmtpMailService(JavaMailSender sender,NotificationMailProperties properties){this.sender=sender;this.properties=properties;}
    @Override public void send(String to,String subject,String html,String text){
        try{var message=sender.createMimeMessage();var helper=new MimeMessageHelper(message,true,"UTF-8");helper.setFrom(properties.from(),properties.fromName());helper.setTo(to);helper.setSubject(subject);helper.setText(text,html);sender.send(message);}
        catch(Exception ex){throw new org.springframework.mail.MailSendException("Envoi de sécurité indisponible");}
    }
}
