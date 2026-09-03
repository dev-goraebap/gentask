package xyz.gentask.module.user.domain.verification;

import java.util.Optional;

public interface VerificationCodeRepository {

    /** 동일한 (이메일, 발급목적) 조합의 기존 인증 코드를 대체하여 저장한다. */
    void save(VerificationCode code);

    Optional<VerificationCode> find(String emailNormalized, VerificationPurpose purpose);

    void delete(String emailNormalized, VerificationPurpose purpose);
}
