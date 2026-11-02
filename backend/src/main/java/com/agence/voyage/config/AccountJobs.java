package com.agence.voyage.config;
import com.agence.voyage.service.AccountSecurityService;
import org.springframework.stereotype.Component;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
@Component @ConditionalOnProperty(name="app.jobs.enabled",havingValue="true",matchIfMissing=true)
public class AccountJobs {
    private final AccountSecurityService accounts;
    public AccountJobs(AccountSecurityService accounts){this.accounts=accounts;}
    @Scheduled(cron="${app.jobs.account-token-purge-cron:0 15 3 * * *}",zone="UTC") public void purge(){accounts.purge();}
}
