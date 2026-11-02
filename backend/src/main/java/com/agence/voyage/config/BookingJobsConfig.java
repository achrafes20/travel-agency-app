package com.agence.voyage.config;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
@Configuration @EnableScheduling
@ConditionalOnProperty(name="booking.jobs.enabled",havingValue="true")
public class BookingJobsConfig {}

