package xyz.gentask.module.user.domain.user;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository {

    void save(User user);

    Optional<User> findById(UUID userId);

    /** 첫 관리자를 설정값의 이메일로 올릴 때 쓴다. */
    Optional<User> findByEmailNormalized(String emailNormalized);

    boolean existsByEmailNormalized(String emailNormalized);
}
