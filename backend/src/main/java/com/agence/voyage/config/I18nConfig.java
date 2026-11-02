package com.agence.voyage.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ReloadableResourceBundleMessageSource;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Configuration
public class I18nConfig implements WebMvcConfigurer {

    public static final List<Locale> SUPPORTED_LOCALES = Arrays.asList(
            Locale.FRENCH,
            Locale.ENGLISH,
            new Locale("ar")
    );

    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver() {
            @Override
            public Locale resolveLocale(HttpServletRequest request) {
                // 1. Paramètre ?lang=
                String paramLang = request.getParameter("lang");
                if (paramLang != null && !paramLang.isBlank()) {
                    for (Locale supported : SUPPORTED_LOCALES) {
                        if (supported.getLanguage().equalsIgnoreCase(paramLang.trim())) {
                            return supported;
                        }
                    }
                }
                // 2. En-tête Accept-Language
                String acceptHeader = request.getHeader("Accept-Language");
                if (acceptHeader != null && !acceptHeader.isBlank()) {
                    try {
                        List<Locale.LanguageRange> ranges = Locale.LanguageRange.parse(acceptHeader);
                        Locale matched = Locale.lookup(ranges, SUPPORTED_LOCALES);
                        if (matched != null) {
                            return matched;
                        }
                    } catch (Exception ignored) {}
                }
                // 3. Défaut : français
                return Locale.FRENCH;
            }
        };
        resolver.setDefaultLocale(Locale.FRENCH);
        resolver.setSupportedLocales(SUPPORTED_LOCALES);
        return resolver;
    }

    @Bean
    public MessageSource messageSource() {
        ReloadableResourceBundleMessageSource messageSource = new ReloadableResourceBundleMessageSource();
        messageSource.setBasename("classpath:messages");
        messageSource.setDefaultEncoding(StandardCharsets.UTF_8.name());
        messageSource.setFallbackToSystemLocale(false);
        messageSource.setDefaultLocale(Locale.FRENCH);
        return messageSource;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new org.springframework.web.servlet.HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
                return true;
            }

            @Override
            public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler,
                                   org.springframework.web.servlet.ModelAndView modelAndView) {
                Locale current = org.springframework.context.i18n.LocaleContextHolder.getLocale();
                if (current != null) {
                    response.setHeader("Content-Language", current.getLanguage());
                }
                response.addHeader("Vary", "Accept-Language");
            }
        });
    }
}

