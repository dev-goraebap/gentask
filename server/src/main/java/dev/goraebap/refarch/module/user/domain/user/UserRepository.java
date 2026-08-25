package dev.goraebap.refarch.module.user.domain.user;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository {

    void save(User user);

    Optional<User> findById(UUID userId);

    boolean existsByEmailNormalized(String emailNormalized);
}
