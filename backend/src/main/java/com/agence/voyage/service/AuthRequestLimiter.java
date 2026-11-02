package com.agence.voyage.service;
/** Remplaçable par un stockage Redis/Bucket4j en déploiement multi-instance. */
public interface AuthRequestLimiter { void check(String action,String ip,String identity); }
