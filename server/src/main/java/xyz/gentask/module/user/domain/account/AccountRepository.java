package xyz.gentask.module.user.domain.account;

import java.util.Optional;
import java.util.UUID;

public interface AccountRepository {

    void save(Account account);

    Optional<Account> findCredential(String emailNormalized);

    Optional<Account> findCredentialByUserId(UUID userId);
}
