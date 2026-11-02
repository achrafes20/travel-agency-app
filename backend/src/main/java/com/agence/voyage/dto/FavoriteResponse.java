package com.agence.voyage.dto;

import com.agence.voyage.entity.Favorite;
import com.agence.voyage.entity.Offer;
import com.agence.voyage.entity.OfferType;
import com.agence.voyage.service.OfferService;

import java.time.LocalDateTime;

public record FavoriteResponse(
        Long id,
        Long offerId,
        String title,
        OfferType type,
        String cityName,
        Double basePrice,
        String primaryImage,
        boolean active,
        LocalDateTime createdAt
) {
    public static FavoriteResponse from(Favorite favorite) {
        Offer offer = favorite.getOffer();
        String primaryImage = (offer.getImages() != null && !offer.getImages().isEmpty())
                ? offer.getImages().get(0)
                : null;
        String cityName = offer.getCity() != null ? offer.getCity().getName() : null;
        OfferType type = OfferService.typeOf(offer);
        boolean active = Boolean.TRUE.equals(offer.getActive());

        return new FavoriteResponse(
                favorite.getId(),
                offer.getId(),
                offer.getTitle(),
                type,
                cityName,
                offer.getBasePrice(),
                primaryImage,
                active,
                favorite.getCreatedAt()
        );
    }
}

