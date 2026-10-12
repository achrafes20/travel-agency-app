package com.agence.voyage.controller;

import com.agence.voyage.dto.OfferRequest;
import com.agence.voyage.dto.OfferResponse;
import com.agence.voyage.entity.OfferType;
import com.agence.voyage.service.OfferService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/offers")
public class OfferController {

    private final OfferService offerService;

    public OfferController(OfferService offerService) {
        this.offerService = offerService;
    }

    @GetMapping
    public List<OfferResponse> list(@RequestParam(required = false) Long supplierId,
                                    @RequestParam(required = false) OfferType type) {
        return offerService.findAll(supplierId, type).stream().map(OfferResponse::from).toList();
    }

    @GetMapping("/{id}")
    public OfferResponse get(@PathVariable Long id) {
        return OfferResponse.from(offerService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OfferResponse create(@Valid @RequestBody OfferRequest request) {
        return OfferResponse.from(offerService.create(request));
    }

    @PutMapping("/{id}")
    public OfferResponse update(@PathVariable Long id, @Valid @RequestBody OfferRequest request) {
        return OfferResponse.from(offerService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        offerService.delete(id);
    }
}
