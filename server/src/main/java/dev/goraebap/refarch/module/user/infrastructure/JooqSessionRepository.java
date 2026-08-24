package dev.goraebap.refarch.module.user.infrastructure;

import static dev.goraebap.refarch.jooq.Tables.SESSIONS;

import dev.goraebap.refarch.jooq.tables.records.SessionsRecord;
import dev.goraebap.refarch.module.user.domain.Session;
import dev.goraebap.refarch.module.user.domain.SessionRepository;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

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
