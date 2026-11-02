package com.agence.voyage.repository;
import com.agence.voyage.entity.WebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface WebhookEventRepository extends JpaRepository<WebhookEvent,Long> {
 Optional<WebhookEvent> findByProviderAndEventId(String provider,String eventId);
}

