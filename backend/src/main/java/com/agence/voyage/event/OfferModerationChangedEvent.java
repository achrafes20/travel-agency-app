package com.agence.voyage.event;
public record OfferModerationChangedEvent(String eventId,Long offerId,Long supplierId,String title,boolean active,String reason) {}
