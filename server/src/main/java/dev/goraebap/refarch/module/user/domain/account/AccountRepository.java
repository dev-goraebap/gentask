package dev.goraebap.refarch.module.user.domain.account;

import java.util.Optional;

public interface AccountRepository {

    void save(Account account);

    /** 로그인의 자격 조회다. 정규화 이메일로 credential 계정을 찾는다. */
    Optional<Account> findCredential(String emailNormalized);
}
