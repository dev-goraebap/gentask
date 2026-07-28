package dev.goraebap.devkit.auth.domain.account;

import java.util.Optional;
import java.util.UUID;

/** 인증 수단 저장소. 구현은 infrastructure/repository. */
public interface AccountRepository {

    void save(Account account);

    Optional<Account> findByUserIdAndProvider(UUID userId, AuthProvider provider);

    Optional<Account> findByProviderAndProviderAccountId(AuthProvider provider, String providerAccountId);
}
