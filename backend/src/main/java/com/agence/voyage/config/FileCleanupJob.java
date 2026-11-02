package com.agence.voyage.config;
import com.agence.voyage.service.FileCleanupService;
import org.springframework.stereotype.Component;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.core.env.Environment;
@Component @ConditionalOnProperty(name="app.jobs.enabled",havingValue="true",matchIfMissing=true)
public class FileCleanupJob {
    private final FileCleanupService service;private final Environment environment;
    public FileCleanupJob(FileCleanupService service,Environment environment){this.service=service;this.environment=environment;}
    @Scheduled(fixedDelayString="${app.jobs.file-cleanup-delay-ms:3600000}") public void run(){
        boolean dry=environment.getProperty("app.jobs.file-cleanup-dry-run",Boolean.class,false);service.purgeExpired(dry);service.reconcile(dry);
    }
}
