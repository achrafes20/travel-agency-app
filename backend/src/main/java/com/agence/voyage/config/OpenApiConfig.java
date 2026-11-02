package com.agence.voyage.config;

import io.swagger.v3.oas.models.*;
import io.swagger.v3.oas.models.info.*;
import io.swagger.v3.oas.models.security.*;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.*;
import org.springdoc.core.customizers.OperationCustomizer;

@Configuration
public class OpenApiConfig {
    @Bean public OpenAPI atlasOpenApi() {
        return new OpenAPI().info(new Info().title("Atlas Voyage API").version("3.0")
                .description("Catalogue et réservations MAD TTC ; paiements SANDBOX, notifications privées et e-mails transactionnels. Aucun débit bancaire réel.")
                .contact(new Contact().name("Équipe Atlas Voyage")))
                .addServersItem(new Server().url("/").description("Serveur courant"))
                .components(new Components().addSecuritySchemes("bearerAuth",
                        new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")));
    }
    @Bean public OperationCustomizer protectedOperations() {
        return (operation, handler) -> {
            String controller = handler.getBeanType().getSimpleName();
            String name = handler.getMethod().getName();
            if((controller.equals("AccountSecurityController")&&java.util.Set.of("forgot","reset","verify").contains(name))
                    ||(controller.equals("FileController")&&name.equals("read")))return operation;
            boolean publicRead = name.equals("list") || name.equals("get") || name.equals("search");
            if (controller.equals("UserController") || controller.equals("PromoCodeController")
                    || controller.equals("CartController") || controller.equals("BookingController") || controller.equals("PaymentController") || controller.equals("NotificationController") || controller.equals("StatsController") || (!publicRead && !controller.equals("AuthController")&&!controller.equals("PaymentWebhookController"))
                    || (controller.equals("AuthController") && name.equals("me"))) {
                operation.addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
            }
            return operation;
        };
    }
}
