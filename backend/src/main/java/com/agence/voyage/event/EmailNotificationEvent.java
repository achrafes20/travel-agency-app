package com.agence.voyage.event;
import java.util.Map;
public record EmailNotificationEvent(String to,String subject,String template,Map<String,String> variables) {
 public EmailNotificationEvent{variables=Map.copyOf(variables);}
}
