package com.agence.voyage.service;
import com.agence.voyage.config.AuthAccountProperties;
import com.agence.voyage.exception.AuthRateLimitException;
import com.github.benmanes.caffeine.cache.*;
import org.springframework.stereotype.Component;
import java.time.*;
import java.util.*;
@Component
public class MemoryAuthRequestLimiter implements AuthRequestLimiter {
    private final Cache<String,Deque<Instant>> windows;private final Clock clock;private final AuthAccountProperties properties;
    public MemoryAuthRequestLimiter(Clock clock,AuthAccountProperties properties){this.clock=clock;this.properties=properties;windows=Caffeine.newBuilder().maximumSize(20000).expireAfterAccess(Duration.ofMinutes(properties.rateWindowMinutes())).build();}
    @Override public void check(String action,String ip,String identity){
        take(action+":ip:"+ip);if(identity!=null)take(action+":identity:"+AccountTokens.hash(identity.strip().toLowerCase(Locale.ROOT)));
    }
    private void take(String key){
        Deque<Instant> queue=windows.get(key,k->new ArrayDeque<>());Instant now=clock.instant();
        synchronized(queue){
            Instant cutoff=now.minusSeconds(properties.rateWindowMinutes()*60L);while(!queue.isEmpty()&&!queue.peek().isAfter(cutoff))queue.remove();
            if(queue.size()>=properties.requestsPerWindow())throw new AuthRateLimitException(Math.max(1,Duration.between(now,queue.peek().plusSeconds(properties.rateWindowMinutes()*60L)).toSeconds()+1));
            queue.add(now);
        }
    }
    public void clear(){windows.invalidateAll();}
}
