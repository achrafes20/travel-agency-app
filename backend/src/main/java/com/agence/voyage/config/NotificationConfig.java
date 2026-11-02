package com.agence.voyage.config;
import org.springframework.context.annotation.*;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
@Configuration @EnableAsync
@EnableConfigurationProperties({NotificationProperties.class,NotificationMailProperties.class,FrontendProperties.class})
public class NotificationConfig {
 @Bean
 public org.thymeleaf.templateresolver.ClassLoaderTemplateResolver notificationTextResolver(){
  var resolver=new org.thymeleaf.templateresolver.ClassLoaderTemplateResolver();
  resolver.setPrefix("templates/");resolver.setSuffix(".txt");resolver.setCharacterEncoding("UTF-8");
  resolver.setTemplateMode(org.thymeleaf.templatemode.TemplateMode.TEXT);
  resolver.setResolvablePatterns(java.util.Set.of("mail/*-text"));resolver.setCheckExistence(true);
  resolver.setOrder(0);return resolver;
 }
 @Bean(name="notificationMailExecutor")
 public ThreadPoolTaskExecutor notificationMailExecutor(){
  var executor=new ThreadPoolTaskExecutor();
  executor.setCorePoolSize(2);executor.setMaxPoolSize(4);executor.setQueueCapacity(500);
  executor.setThreadNamePrefix("notification-mail-");executor.setWaitForTasksToCompleteOnShutdown(true);
  executor.setAwaitTerminationSeconds(10);return executor;
 }
}
