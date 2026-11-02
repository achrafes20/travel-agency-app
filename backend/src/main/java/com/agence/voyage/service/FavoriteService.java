package com.agence.voyage.service;

import com.agence.voyage.dto.FavoriteResponse;
import com.agence.voyage.entity.Favorite;
import com.agence.voyage.entity.Offer;
import com.agence.voyage.entity.User;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.exception.ErrorCode;
import com.agence.voyage.exception.ResourceNotFoundException;
import com.agence.voyage.repository.FavoriteRepository;
import com.agence.voyage.repository.OfferRepository;
import com.agence.voyage.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final OfferRepository offerRepository;
    private final UserRepository userRepository;

    public FavoriteService(FavoriteRepository favoriteRepository,
                           OfferRepository offerRepository,
                           UserRepository userRepository) {
        this.favoriteRepository = favoriteRepository;
        this.offerRepository = offerRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<FavoriteResponse> list(Long clientId, Pageable pageable) {
        User client = userRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : id=" + clientId));
        return favoriteRepository.findByClient(client, pageable)
                .map(FavoriteResponse::from);
    }

    @Transactional(readOnly = true)
    public List<Long> listIds(Long clientId) {
        return favoriteRepository.findOfferIdsByClientId(clientId);
    }

    @Transactional
    public FavoriteResponse add(Long clientId, Long offerId) {
        User client = userRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : id=" + clientId));
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offre introuvable : id=" + offerId));

        if (!Boolean.TRUE.equals(offer.getActive())) {
            throw new BusinessException(ErrorCode.OFFER_INACTIVE, "Impossible d'ajouter une offre inactive aux favoris");
        }

        return favoriteRepository.findByClientAndOffer(client, offer)
                .map(FavoriteResponse::from)
                .orElseGet(() -> {
                    Favorite saved = favoriteRepository.save(new Favorite(client, offer));
                    return FavoriteResponse.from(saved);
                });
    }

    @Transactional
    public void remove(Long clientId, Long offerId) {
        userRepository.findById(clientId).ifPresent(client ->
                offerRepository.findById(offerId).ifPresent(offer ->
                        favoriteRepository.deleteByClientAndOffer(client, offer)
                )
        );
    }
}
