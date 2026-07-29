package dev.goraebap.devkit.auth.infrastructure.repository;

import static dev.goraebap.devkit.jooq.Tables.SESSIONS;

import dev.goraebap.devkit.auth.domain.session.Session;
import dev.goraebap.devkit.auth.domain.session.SessionRepository;
import dev.goraebap.devkit.jooq.tables.records.SessionsRecord;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
class JooqSessionRepository implements SessionRepository {

    private final DSLContext dsl;

    JooqSessionRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    @Override
    public void save(Session session) {
        dsl.insertInto(SESSIONS)
                .set(SESSIONS.ID, session.id())
                .set(SESSIONS.USER_ID, session.userId())
                .set(SESSIONS.TOKEN_HASH, session.tokenHash())
                .set(SESSIONS.EXPIRES_AT, offset(session.expiresAt()))
                .set(SESSIONS.LAST_USED_AT, offset(session.lastUsedAt()))
                .set(SESSIONS.IP_ADDRESS, session.ipAddress())
                .set(SESSIONS.USER_AGENT, session.userAgent())
                .set(SESSIONS.CREATED_AT, offset(session.createdAt()))
                .onConflict(SESSIONS.ID)
                .doUpdate()
                .set(SESSIONS.EXPIRES_AT, offset(session.expiresAt()))
                .set(SESSIONS.LAST_USED_AT, offset(session.lastUsedAt()))
                .execute();
    }

    @Override
    public Optional<Session> findByTokenHash(String tokenHash) {
        return dsl.selectFrom(SESSIONS)
                .where(SESSIONS.TOKEN_HASH.eq(tokenHash))
                .fetchOptional()
                .map(JooqSessionRepository::toDomain);
    }

    @Override
    public void deleteById(UUID id) {
        dsl.deleteFrom(SESSIONS).where(SESSIONS.ID.eq(id)).execute();
    }

    @Override
    public boolean deleteByIdAndUserId(UUID id, UUID userId) {
        return dsl.deleteFrom(SESSIONS)
                        .where(SESSIONS.ID.eq(id).and(SESSIONS.USER_ID.eq(userId)))
                        .execute()
                > 0;
    }

    @Override
    public void deleteAllByUserId(UUID userId) {
        dsl.deleteFrom(SESSIONS).where(SESSIONS.USER_ID.eq(userId)).execute();
    }

    private static Session toDomain(SessionsRecord record) {
        return Session.restore(
                record.getId(),
                record.getUserId(),
                record.getTokenHash(),
                record.getExpiresAt().toInstant(),
                record.getLastUsedAt().toInstant(),
                record.getIpAddress(),
                record.getUserAgent(),
                record.getCreatedAt().toInstant());
    }

    private static OffsetDateTime offset(Instant instant) {
        return OffsetDateTime.ofInstant(instant, ZoneOffset.UTC);
    }
}
