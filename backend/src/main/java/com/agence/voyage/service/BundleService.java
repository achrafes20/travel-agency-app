package com.agence.voyage.service;

import com.agence.voyage.dto.BundleRequest;
import com.agence.voyage.entity.Bundle;
import com.agence.voyage.entity.Offer;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.User;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.exception.ResourceNotFoundException;
import com.agence.voyage.repository.BundleRepository;
import com.agence.voyage.repository.OfferRepository;
import com.agence.voyage.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

@Service
public class BundleService {

    private static final int MIN_OFFERS = 2;

    private final BundleRepository bundleRepository;
    private final OfferRepository offerRepository;
    private final UserRepository userRepository;

    public BundleService(BundleRepository bundleRepository, OfferRepository offerRepository, UserRepository userRepository) {
        this.bundleRepository = bundleRepository;
        this.offerRepository = offerRepository;
        this.userRepository = userRepository;
    }

    public List<Bundle> findAll(Long agentId) {
        return agentId != null ? bundleRepository.findByCreatedById(agentId) : bundleRepository.findAll();
    }

    public Bundle findById(Long id) {
        return bundleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bundle introuvable : id=" + id));
    }

    @Transactional
    public Bundle create(BundleRequest request) {
        Bundle bundle = new Bundle();
        apply(bundle, request);
        return bundleRepository.save(bundle);
    }

    @Transactional
    public Bundle update(Long id, BundleRequest request) {
        Bundle bundle = findById(id);
        apply(bundle, request);
        return bundleRepository.save(bundle);
    }

    @Transactional
    public void delete(Long id) {
        Bundle bundle = findById(id);
        try {
            bundleRepository.delete(bundle);
            bundleRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessException("Impossible de supprimer ce bundle : il est utilisé dans des paniers ou des réservations");
        }
    }

    private void apply(Bundle bundle, BundleRequest r) {
        User agent = userRepository.findById(r.getCreatedById())
                .orElseThrow(() -> new ResourceNotFoundException("Agent introuvable : id=" + r.getCreatedById()));
        if (agent.getRole() != Role.AGENT || agent.isArchived()) {
            throw new BusinessException("L'utilisateur indiqué n'est pas un agent actif");
        }

        LinkedHashSet<Long> offerIds = new LinkedHashSet<>(r.getOfferIds());
        if (offerIds.size() < MIN_OFFERS) {
            throw new BusinessException("Un bundle doit contenir au moins " + MIN_OFFERS + " offres différentes");
        }
        List<Offer> offers = new ArrayList<>();
        for (Long offerId : offerIds) {
            offers.add(offerRepository.findById(offerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Offre introuvable : id=" + offerId)));
        }

        bundle.setTitle(r.getTitle().trim());
        bundle.setDescription(r.getDescription() == null || r.getDescription().isBlank() ? null : r.getDescription().trim());
        bundle.setDiscountPercentage(r.getDiscountPercentage() == null ? 0.0 : r.getDiscountPercentage());
        bundle.setOffers(offers);
        bundle.setCreatedBy(agent);
    }
}
