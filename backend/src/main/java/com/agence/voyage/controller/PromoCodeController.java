package com.agence.voyage.controller;

import com.agence.voyage.dto.PromoCodeRequest;
import com.agence.voyage.dto.PromoCodeResponse;
import com.agence.voyage.service.PromoCodeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/promo-codes")
public class PromoCodeController {

    private final PromoCodeService promoCodeService;

    public PromoCodeController(PromoCodeService promoCodeService) {
        this.promoCodeService = promoCodeService;
    }

    @GetMapping
    public List<PromoCodeResponse> list() {
        return promoCodeService.findAll().stream().map(PromoCodeResponse::from).toList();
    }

    @GetMapping("/{id}")
    public PromoCodeResponse get(@PathVariable Long id) {
        return PromoCodeResponse.from(promoCodeService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PromoCodeResponse create(@Valid @RequestBody PromoCodeRequest request) {
        return PromoCodeResponse.from(promoCodeService.create(request));
    }

    @PutMapping("/{id}")
    public PromoCodeResponse update(@PathVariable Long id, @Valid @RequestBody PromoCodeRequest request) {
        return PromoCodeResponse.from(promoCodeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        promoCodeService.delete(id);
    }
}
