package com.agence.voyage.service;
import com.agence.voyage.config.NotificationMailProperties;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.context.Context;
import org.slf4j.*;
import java.util.*;
@Service
public class EmailService {
 private static final Logger log=LoggerFactory.getLogger(EmailService.class);
 private final JavaMailSender sender;private final SpringTemplateEngine templates;private final NotificationMailProperties properties;
 public EmailService(JavaMailSender sender,SpringTemplateEngine templates,NotificationMailProperties properties){
  this.sender=sender;this.templates=templates;this.properties=properties;
 }
 @Async("notificationMailExecutor")
 public void send(String to,String subject,String templateName,Map<String,String> variables){
  if(!properties.enabled()){log.info("email_disabled template={}",templateName);return;}
  for(int attempt=1;attempt<=2;attempt++){
   try{
    var context=new Context(Locale.FRENCH);variables.forEach(context::setVariable);
    String html=templates.process("mail/"+templateName,context);
    String text=templates.process("mail/"+templateName+"-text",context);
    MimeMessage message=sender.createMimeMessage();
    var helper=new MimeMessageHelper(message,true,"UTF-8");
    helper.setFrom(properties.from());helper.setTo(to);helper.setSubject(subject);
    helper.setText(text,html);sender.send(message);
    log.info("email_sent template={}",templateName);return;
   }catch(Exception ex){log.warn("email_failed template={} attempt={}",templateName,attempt);}
  }
 }
}
