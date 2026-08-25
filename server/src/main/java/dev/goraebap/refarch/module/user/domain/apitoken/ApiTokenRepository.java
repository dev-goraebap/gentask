package dev.goraebap.refarch.module.user.domain.apitoken;

import java.util.Optional;
import java.util.UUID;

public interface ApiTokenRepository {

    void save(ApiToken apiToken);

    Optional<ApiToken> findByTokenHash(String tokenHash);

    Optional<ApiToken> findByUserId(UUID userId);

    void deleteByUserId(UUID userId);
}
