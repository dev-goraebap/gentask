package dev.goraebap.refarch.module.user.infrastructure;

import static dev.goraebap.refarch.jooq.Tables.API_TOKENS;

import dev.goraebap.refarch.jooq.tables.records.ApiTokensRecord;
import dev.goraebap.refarch.module.user.domain.ApiToken;
import dev.goraebap.refarch.module.user.domain.ApiTokenRepository;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
class JooqApiTokenRepository implements ApiTokenRepository {

    private final DSLContext dslContext;

    /** 계정당 하나라는 규칙을 user_id 충돌로 구현한다. 재발급이 곧 교체다. */
    @Override
    public void save(ApiToken apiToken) {
        dslContext
                .insertInto(API_TOKENS)
                .set(API_TOKENS.ID, apiToken.id())
                .set(API_TOKENS.USER_ID, apiToken.userId())
                .set(API_TOKENS.TOKEN_HASH, apiToken.tokenHash())
                .set(API_TOKENS.CREATED_AT, apiToken.createdAt())
                .onConflict(API_TOKENS.USER_ID)
                .doUpdate()
                .set(API_TOKENS.TOKEN_HASH, apiToken.tokenHash())
                .set(API_TOKENS.CREATED_AT, apiToken.createdAt())
                .execute();
    }

    @Override
    public Optional<ApiToken> findByTokenHash(String tokenHash) {
        return dslContext
                .selectFrom(API_TOKENS)
                .where(API_TOKENS.TOKEN_HASH.eq(tokenHash))
                .fetchOptional()
                .map(JooqApiTokenRepository::toDomain);
    }

    @Override
    public Optional<ApiToken> findByUserId(UUID userId) {
        return dslContext
                .selectFrom(API_TOKENS)
                .where(API_TOKENS.USER_ID.eq(userId))
                .fetchOptional()
                .map(JooqApiTokenRepository::toDomain);
    }

    @Override
    public void deleteByUserId(UUID userId) {
        dslContext.deleteFrom(API_TOKENS).where(API_TOKENS.USER_ID.eq(userId)).execute();
    }

    private static ApiToken toDomain(ApiTokensRecord apiTokensRecord) {
        return ApiToken.restore(
                apiTokensRecord.getId(),
                apiTokensRecord.getUserId(),
                apiTokensRecord.getTokenHash(),
                apiTokensRecord.getCreatedAt());
    }
}
