package com.agence.voyage.profile;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import com.agence.voyage.config.StorageProperties;
import java.time.Clock;
/** Dépendances explicites des tests JPA de services, sans élargir leur contexte Web. */
@TestConfiguration @EnableConfigurationProperties(StorageProperties.class)
public class AssetTestConfiguration { @Bean Clock assetTestClock(){return Clock.systemUTC();} }
