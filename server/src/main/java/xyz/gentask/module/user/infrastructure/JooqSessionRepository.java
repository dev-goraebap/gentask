package xyz.gentask.module.user.infrastructure;

import static xyz.gentask.jooq.Tables.SESSIONS;

import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.gentask.jooq.tables.records.SessionsRecord;
import xyz.gentask.module.user.domain.session.Session;
import xyz.gentask.module.user.domain.session.SessionRepository;

@Repository
@RequiredArgsConstructor
class JooqSessionRepository implements SessionRepository {

    private final DSLContext dslContext;

    @Override
    public void save(Session session) {
        dslContext
                .insertInto(SESSIONS)
                .set(SESSIONS.ID, session.id())
                .set(SESSIONS.USER_ID, session.userId())
                .set(SESSIONS.TOKEN_HASH, session.tokenHash())
                .set(SESSIONS.EXPIRES_AT, session.expiresAt())
                .set(SESSIONS.LAST_USED_AT, session.lastUsedAt())
                .set(SESSIONS.CREATED_AT, session.createdAt())
                .onConflict(SESSIONS.ID)
                .doUpdate()
                .set(SESSIONS.EXPIRES_AT, session.expiresAt())
                .set(SESSIONS.LAST_USED_AT, session.lastUsedAt())
                .execute();
    }

    @Override
    public Optional<Session> findByTokenHash(String tokenHash) {
        return dslContext
                .selectFrom(SESSIONS)
                .where(SESSIONS.TOKEN_HASH.eq(tokenHash))
                .fetchOptional()
                .map(JooqSessionRepository::toDomain);
    }

    @Override
    public void deleteById(UUID sessionId) {
        dslContext.deleteFrom(SESSIONS).where(SESSIONS.ID.eq(sessionId)).execute();
    }

    @Override
    public void deleteByUserId(UUID userId) {
        dslContext.deleteFrom(SESSIONS).where(SESSIONS.USER_ID.eq(userId)).execute();
    }

    @Override
    public void deleteByUserIdExcept(UUID userId, UUID keepSessionId) {
        // Bearer 토큰 요청 시에는 세션 쿠키를 발급하거나 연장하지 않는다.
        var condition = SESSIONS.USER_ID.eq(userId);
        dslContext
                .deleteFrom(SESSIONS)
                .where(keepSessionId == null ? condition : condition.and(SESSIONS.ID.ne(keepSessionId)))
                .execute();
    }

    private static Session toDomain(SessionsRecord sessionsRecord) {
        return Session.restore(
                sessionsRecord.getId(),
                sessionsRecord.getUserId(),
                sessionsRecord.getTokenHash(),
                sessionsRecord.getExpiresAt(),
                sessionsRecord.getLastUsedAt(),
                sessionsRecord.getCreatedAt());
    }
}
