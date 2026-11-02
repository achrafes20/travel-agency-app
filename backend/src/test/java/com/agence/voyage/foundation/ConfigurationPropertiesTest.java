package com.agence.voyage.foundation;

import com.agence.voyage.config.AppProperties;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;
import static org.assertj.core.api.Assertions.assertThat;

class ConfigurationPropertiesTest {
    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(AppProperties.class)
    static class Config {}
    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withUserConfiguration(Config.class).withPropertyValues(
                    "app.jwt.secret=" + java.util.Base64.getEncoder().encodeToString(new byte[32]),
                    "app.cors.allowed-origins=http://localhost:5500");
    @Test void defaultsAndCommaSeparatedOrigins() {
        runner.withPropertyValues("app.cors.allowed-origins=http://localhost:5500,http://127.0.0.1:5500").run(context -> {
            assertThat(context).hasNotFailed();
            var p = context.getBean(AppProperties.class);
            assertThat(p.booking().cancellation().freeHours()).isEqualTo(48);
            assertThat(p.booking().paymentExpirationMinutes()).isEqualTo(30);
            assertThat(p.currency().reference()).isEqualTo("MAD");
            assertThat(p.cors().allowedOrigins()).hasSize(2);
        });
    }
    @Test void rejectsInvalidBusinessConfiguration() {
        for (String value : new String[]{"app.booking.cancellation.free-hours=12",
                "app.booking.payment-expiration-minutes=0", "app.booking.cancellation.partial-refund-percent=101",
                "app.currency.reference=EUR", "app.jwt.expiration-ms=0"}) {
            runner.withPropertyValues(value).run(context -> assertThat(context).hasFailed());
        }
    }
}
