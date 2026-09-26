package com.agence.voyage;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TravelAgencyApplication {
    public static void main(String[] args) {
        SpringApplication.run(TravelAgencyApplication.class, args);
        System.out.println("Backend Spring Boot demarre avec succes !");
    }
}
