package com.agence.voyage.service;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.*;
/** Aucun jeton brut persistant : 256 bits aléatoires, SHA-256 en base. */
public final class AccountTokens {
    private static final SecureRandom RANDOM=new SecureRandom();
    private AccountTokens(){}
    public static String create(){byte[] bytes=new byte[32];RANDOM.nextBytes(bytes);return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);}
    public static String hash(String value){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}catch(NoSuchAlgorithmException ex){throw new IllegalStateException("SHA-256 indisponible",ex);}}
}
