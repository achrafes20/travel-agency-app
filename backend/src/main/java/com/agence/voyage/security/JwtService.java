package com.agence.voyage.security;

import com.agence.voyage.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import com.agence.voyage.config.AppProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(AppProperties properties,
                      @Value("${app.jwt.access-ttl-seconds:900}") long accessTtlSeconds) {
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(properties.jwt().secret()));
        // Si expirationMs n'a pas été explicitement surchargé à une valeur différente de la valeur par défaut 24h, on applique le TTL court 15 min (900s)
        if (properties.jwt().expirationMs() != 86400000L) {
            this.expirationMs = properties.jwt().expirationMs();
        } else {
            this.expirationMs = accessTtlSeconds * 1000L;
        }
    }

    public String generateToken(User user) {
        Date now = new Date();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(user.getEmail())
                .claim("userId", user.getId())
                .claim("role", user.getRole().name())
                .claim("tv", user.getTokenVersion())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(key)
                .compact();
    }

    /** Retourne les claims si le jeton est valide et non expiré, sinon vide. */
    public Optional<Claims> parse(String token) {
        try {
            return Optional.of(Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload());
        } catch (JwtException | IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    /** Laisse remonter l'expiration pour produire TOKEN_EXPIRED dans le filtre. */
    public Claims parseVerified(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }

    /** Retourne l'email (sujet) si le jeton est valide, sinon vide. */
    public Optional<String> extractEmail(String token) {
        return parse(token).map(Claims::getSubject);
    }
}
