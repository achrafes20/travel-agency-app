package com.agence.voyage.config;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
@Configuration @EnableConfigurationProperties({StorageProperties.class,AuthAccountProperties.class,UploadProperties.class})
public class ProfileConfig {}
