package dev.goraebap.devkit.auth.domain.user;

import java.util.Optional;
import java.util.UUID;

/** 사용자 저장소. 구현은 infrastructure/repository. */
public interface UserRepository {

    void save(User user);

    Optional<User> findById(UUID id);

    Optional<User> findByEmailNormalized(String emailNormalized);

    boolean existsByEmailNormalized(String emailNormalized);
}
