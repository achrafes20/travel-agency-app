package com.agence.voyage.service;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class CurrencyService {

    public static final String BASE_CURRENCY = "MAD";

    private static final Map<String, Double> DEFAULT_RATES = new LinkedHashMap<>();

    static {
        DEFAULT_RATES.put("MAD", 1.0);
        DEFAULT_RATES.put("EUR", 0.092);
        DEFAULT_RATES.put("USD", 0.100);
        DEFAULT_RATES.put("GBP", 0.078);
    }

    @Cacheable(value = "currencyRates", unless = "#result == null")
    public Map<String, Object> getExchangeRates() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("base", BASE_CURRENCY);
        response.put("rates", new LinkedHashMap<>(DEFAULT_RATES));
        response.put("updatedAt", Instant.now().toString());
        response.put("disclaimer", "Taux indicatifs pour affichage uniquement. Tout paiement est obligatoirement effectué en Dirhams Marocains (MAD).");
        return response;
    }
}

