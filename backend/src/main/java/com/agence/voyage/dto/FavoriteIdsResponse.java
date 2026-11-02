package com.agence.voyage.dto;

import java.util.List;

public record FavoriteIdsResponse(
        List<Long> offerIds
) {
}

