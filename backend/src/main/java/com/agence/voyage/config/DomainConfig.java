package com.agence.voyage.config;

import com.agence.voyage.domain.*;
import org.springframework.context.annotation.*;
import java.time.Clock;

@Configuration
public class DomainConfig {
    @Bean public Clock clock() { return Clock.systemUTC(); }
    @Bean public CancellationPolicy cancellationPolicy(AppProperties properties, Clock clock) {
        return new CancellationPolicy(properties.booking().cancellation(), clock);
    }
    @Bean public BookingStateMachine bookingStateMachine() { return new BookingStateMachine(); }
    @Bean public PaymentStateMachine paymentStateMachine() { return new PaymentStateMachine(); }
}
