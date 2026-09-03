package xyz.gentask.module.user.domain.user;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository {

    void save(User user);

    Optional<User> findById(UUID userId);

    /** 설정에 지정된 초기 관리자 계정 권한을 승격할 때 사용한다. */
    Optional<User> findByEmailNormalized(String emailNormalized);

    boolean existsByEmailNormalized(String emailNormalized);
}
