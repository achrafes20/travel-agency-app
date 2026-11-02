package com.agence.voyage.controller;

import com.agence.voyage.service.CurrencyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/currencies")
@Tag(name = "Devises", description = "Taux de change indicatifs pour l'affichage multidevises.")
public class CurrencyController {

    private final CurrencyService currencyService;

    public CurrencyController(CurrencyService currencyService) {
        this.currencyService = currencyService;
    }

    @GetMapping("/rates")
    @Operation(summary = "Obtenir les taux de change indicatifs par rapport au MAD")
    public ResponseEntity<Map<String, Object>> getRates() {
        return ResponseEntity.ok(currencyService.getExchangeRates());
    }
}

