package com.agence.voyage.service;
import com.agence.voyage.event.AccountMailEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
@Component
public class AccountMailListener {
    private final MailService mail;private final TaskExecutor executor;
    private static final org.slf4j.Logger log=org.slf4j.LoggerFactory.getLogger(AccountMailListener.class);
    public AccountMailListener(MailService mail,@Qualifier("notificationMailExecutor") TaskExecutor executor){this.mail=mail;this.executor=executor;}
    @TransactionalEventListener(phase=TransactionPhase.AFTER_COMMIT)
    public void deliver(AccountMailEvent event){
        try{executor.execute(()->{try{mail.send(event.to(),event.subject(),event.html(),event.text());}catch(Exception ex){log.warn("account_mail_failed");}});}
        catch(Exception ex){log.warn("account_mail_queue_full");}
    }
}
