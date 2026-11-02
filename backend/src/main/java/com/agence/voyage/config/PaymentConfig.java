package com.agence.voyage.config;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.core.env.*;
import jakarta.annotation.PostConstruct;

@Configuration @EnableConfigurationProperties(PaymentProperties.class)
public class PaymentConfig {
 private final PaymentProperties properties;private final Environment environment;
 public PaymentConfig(PaymentProperties properties,Environment environment){this.properties=properties;this.environment=environment;}
 @PostConstruct void validate(){
  // Validation manuelle : le FailureAnalyzer Bean Validation ne doit jamais afficher une clé rejetée.
  if(properties.webhookSecret()==null||properties.webhookSecret().isBlank()||properties.webhookSecret().length()<32)
   throw new IllegalStateException("payment.webhook-secret doit contenir au moins 32 caractères");
  if(environment.acceptsProfiles(Profiles.of("prod")) && (properties.provider().equalsIgnoreCase("sandbox")
      || properties.webhookSecret().startsWith("dev-")))
   throw new IllegalStateException("Paiements en production : sandbox et secret de développement interdits");
  if(!properties.provider().equalsIgnoreCase("sandbox"))
   throw new IllegalStateException("Aucun connecteur de paiement réel activé ; configurer un adaptateur audité avant déploiement");
 }
}

