package xyz.gentask.module.notification.domain.failure;

import java.util.Optional;
import java.util.UUID;

public interface PushDeliveryFailureRepository {

    void save(PushDeliveryFailure failure);

    Optional<PushDeliveryFailure> findById(UUID failureId);
}
