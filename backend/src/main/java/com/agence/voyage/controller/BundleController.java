package com.agence.voyage.controller;

import com.agence.voyage.dto.BundleRequest;
import com.agence.voyage.dto.BundleResponse;
import com.agence.voyage.security.AppUserDetails;
import com.agence.voyage.service.BundleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
@RequestMapping("/api/bundles")
public class BundleController {

    private final BundleService bundleService;

    public BundleController(BundleService bundleService) {
        this.bundleService = bundleService;
    }

    @GetMapping
    public List<BundleResponse> list(@RequestParam(required = false) Long agentId) {
        return bundleService.findAll(agentId).stream().map(BundleResponse::from).toList();
    }

    @GetMapping("/{id}")
    public BundleResponse get(@PathVariable Long id) {
        return BundleResponse.from(bundleService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BundleResponse create(@Valid @RequestBody BundleRequest request,
                                 @AuthenticationPrincipal AppUserDetails principal) {
        // le créateur est toujours l'agent connecté, jamais l'identifiant envoyé dans le corps
        request.setCreatedById(principal.getId());
        return BundleResponse.from(bundleService.create(request));
    }

    @PutMapping("/{id}")
    public BundleResponse update(@PathVariable Long id, @Valid @RequestBody BundleRequest request,
                                 @AuthenticationPrincipal AppUserDetails principal) {
        request.setCreatedById(principal.getId());
        return BundleResponse.from(bundleService.update(id, request, principal.getId()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal AppUserDetails principal) {
        bundleService.delete(id, principal.getId());
    }
}
