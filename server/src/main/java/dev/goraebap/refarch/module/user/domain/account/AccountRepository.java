package dev.goraebap.refarch.module.user.domain.account;

import java.util.Optional;

public interface AccountRepository {

    void save(Account account);

    Optional<Account> findCredential(String emailNormalized);
}
