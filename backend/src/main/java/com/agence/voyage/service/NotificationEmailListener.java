package com.agence.voyage.service;
import com.agence.voyage.event.EmailNotificationEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.*;
import org.slf4j.*;
@Component
public class NotificationEmailListener {
 private static final Logger log=LoggerFactory.getLogger(NotificationEmailListener.class);
 private final EmailService emails;
 public NotificationEmailListener(EmailService emails){this.emails=emails;}
 @TransactionalEventListener(phase=TransactionPhase.AFTER_COMMIT)
 public void send(EmailNotificationEvent event){
  try{emails.send(event.to(),event.subject(),event.template(),event.variables());}
  catch(RuntimeException ex){log.warn("email_submission_failed");}
 }
}
