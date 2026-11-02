package com.agence.voyage;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.boot.context.properties.EnableConfigurationProperties({com.agence.voyage.config.AppProperties.class, com.agence.voyage.config.BookingModuleProperties.class})
public class TravelAgencyApplication {
    public static void main(String[] args) {
        SpringApplication.run(TravelAgencyApplication.class, args);
        org.slf4j.LoggerFactory.getLogger(TravelAgencyApplication.class).info("Backend Spring Boot démarré avec succès");
    }
}
