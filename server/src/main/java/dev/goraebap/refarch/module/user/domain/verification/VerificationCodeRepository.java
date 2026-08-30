package dev.goraebap.refarch.module.user.domain.verification;

import java.util.Optional;

public interface VerificationCodeRepository {

    /** 같은 (이메일, 자리)의 앞선 코드를 갈아 끼운다. 다시 요청하는 것이 곧 이 덮어쓰기다. */
    void save(VerificationCode code);

    Optional<VerificationCode> find(String emailNormalized, VerificationPurpose purpose);

    void delete(String emailNormalized, VerificationPurpose purpose);
}
