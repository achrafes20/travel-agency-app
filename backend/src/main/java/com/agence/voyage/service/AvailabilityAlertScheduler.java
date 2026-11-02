package com.agence.voyage.service;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.slf4j.*;
@Component @ConditionalOnProperty(name="app.scheduling.enabled",havingValue="true",matchIfMissing=true)
public class AvailabilityAlertScheduler {
 private static final Logger log=LoggerFactory.getLogger(AvailabilityAlertScheduler.class);
 private final AvailabilityAlertService alerts;private final NotificationService notifications;
 public AvailabilityAlertScheduler(AvailabilityAlertService alerts,NotificationService notifications){this.alerts=alerts;this.notifications=notifications;}
 @Scheduled(cron="${app.notifications.alert-cron:0 0 * * * *}")
 public void check(){try{alerts.scan();}catch(RuntimeException ex){log.warn("notification_alert_scan_failed");}}
 @Scheduled(cron="${app.notifications.purge-cron:0 30 3 * * *}")
 public void purge(){try{log.info("notification_purge count={}",notifications.purgeOld());}catch(RuntimeException ex){log.warn("notification_purge_failed");}}
}
