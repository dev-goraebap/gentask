package dev.goraebap.devkit.auth.domain.user;

import java.util.Optional;
import java.util.UUID;

/** 사용자 저장소. 구현은 infrastructure/repository. */
public interface UserRepository {

    void save(User user);

    /**
     * 그 이메일을 쓰는 사용자가 아직 없을 때만 등록하고 {@code true}를 반환한다.
     *
     * <p>존재 검사와 INSERT를 한 문장으로 합친다. 나눠서 하면 그 사이의 경합이 유일성 제약 위반
     * 예외가 되고, PostgreSQL은 제약 위반이 난 트랜잭션을 중단 상태로 만들어 <b>같은 트랜잭션에서
     * 기록한 OTP 시도·소진까지 함께 유실된다</b> — 소진됐어야 할 코드가 되살아난다.
     */
    boolean registerIfEmailAvailable(User user);

    Optional<User> findById(UUID id);

    Optional<User> findByEmailNormalized(String emailNormalized);

    boolean existsByEmailNormalized(String emailNormalized);
}
