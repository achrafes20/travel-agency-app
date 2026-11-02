package com.agence.voyage.event;
/** Événement métier d'inscription, distinct de la notification de bienvenue rejouable. */
public record AccountRegisteredEvent(Long userId) {}
