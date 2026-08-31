package xyz.gentask.module.notification.domain.subscription;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PushSubscriptionRepository {

    void save(PushSubscription subscription);

    List<PushSubscription> findByUserId(UUID userId);

    Optional<PushSubscription> findByEndpoint(String endpoint);

    int countByUserId(UUID userId);

    void deleteByEndpoint(String endpoint);

    void deleteById(UUID subscriptionId);
}
