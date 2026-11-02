package com.agence.voyage.security;

import com.agence.voyage.exception.AuthRateLimitException;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

@Service
public class RateLimitingService {

    @Value("${app.rate-limit.enabled:true}")
    private boolean enabled;

    @Value("${app.rate-limit.auth.ip-capacity:20}")
    private long authIpCapacity;

    @Value("${app.rate-limit.auth.ip-refill-seconds:60}")
    private long authIpRefillSeconds;

    @Value("${app.rate-limit.auth.id-capacity:5}")
    private long authIdCapacity;

    @Value("${app.rate-limit.auth.id-refill-seconds:300}")
    private long authIdRefillSeconds;

    @Value("${app.rate-limit.api.ip-capacity:200}")
    private long apiIpCapacity;

    @Value("${app.rate-limit.api.ip-refill-seconds:60}")
    private long apiIpRefillSeconds;

    private final Cache<String, Bucket> buckets = Caffeine.newBuilder()
            .maximumSize(50_000)
            .expireAfterAccess(Duration.ofHours(1))
            .build();

    public record RateLimitProbe(boolean allowed, long retryAfterSeconds) {}

    public RateLimitProbe checkAuthIp(String ip) {
        if (!enabled) return new RateLimitProbe(true, 0);
        String key = "auth:ip:" + (ip != null ? ip : "127.0.0.1");
        return probe(key, authIpCapacity, authIpRefillSeconds);
    }

    public RateLimitProbe checkGlobalApi(String ip) {
        if (!enabled) return new RateLimitProbe(true, 0);
        String key = "api:ip:" + (ip != null ? ip : "127.0.0.1");
        return probe(key, apiIpCapacity, apiIpRefillSeconds);
    }

    public void checkAuthIdentity(String action, String identity) {
        if (!enabled || identity == null || identity.isBlank()) return;
        String normalized = identity.strip().toLowerCase(Locale.ROOT);
        String key = "auth:id:" + action + ":" + normalized;
        RateLimitProbe result = probe(key, authIdCapacity, authIdRefillSeconds);
        if (!result.allowed()) {
            throw new AuthRateLimitException(result.retryAfterSeconds());
        }
    }

    private RateLimitProbe probe(String key, long capacity, long refillSeconds) {
        Bucket bucket = buckets.get(key, k -> createBucket(capacity, refillSeconds));
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            return new RateLimitProbe(true, 0);
        }
        long waitNanos = probe.getNanosToWaitForRefill();
        long retryAfter = Math.max(1, TimeUnit.NANOSECONDS.toSeconds(waitNanos));
        return new RateLimitProbe(false, retryAfter);
    }

    private Bucket createBucket(long capacity, long refillSeconds) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(capacity)
                .refillIntervally(capacity, Duration.ofSeconds(refillSeconds))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    public void reset() {
        buckets.invalidateAll();
    }
}

