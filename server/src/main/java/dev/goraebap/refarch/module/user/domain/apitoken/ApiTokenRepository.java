package dev.goraebap.refarch.module.user.domain.apitoken;

import java.util.Optional;
import java.util.UUID;

public interface ApiTokenRepository {

    /** 계정당 하나다. 이미 있으면 교체한다. */
    void save(ApiToken apiToken);

    Optional<ApiToken> findByTokenHash(String tokenHash);

    Optional<ApiToken> findByUserId(UUID userId);

    void deleteByUserId(UUID userId);
}
