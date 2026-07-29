package dev.goraebap.devkit.auth.infrastructure.query;

import static dev.goraebap.devkit.jooq.Tables.SESSIONS;
import static dev.goraebap.devkit.jooq.Tables.USERS;

import dev.goraebap.devkit.auth.application.session.CurrentSessionView;
import dev.goraebap.devkit.auth.application.session.SessionQueries;
import dev.goraebap.devkit.auth.application.session.UserSessionView;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jooq.DSLContext;
import org.springframework.stereotype.Component;

/** 조회 어댑터 — SQL은 여기서만 보인다 (설계/서버.md §5.1). */
@Component
class JooqSessionQueries implements SessionQueries {

    private final DSLContext dsl;
    private final Clock clock;

    JooqSessionQueries(DSLContext dsl, Clock clock) {
        this.dsl = dsl;
        this.clock = clock;
    }

    @Override
    public Optional<CurrentSessionView> findCurrentSession(UUID sessionId) {
        return dsl.select(USERS.ID, USERS.EMAIL, USERS.NICKNAME, SESSIONS.EXPIRES_AT)
                .from(SESSIONS)
                .join(USERS)
                .on(USERS.ID.eq(SESSIONS.USER_ID))
                .where(SESSIONS.ID.eq(sessionId))
                .fetchOptional(record -> new CurrentSessionView(
                        record.get(USERS.ID),
                        record.get(USERS.EMAIL),
                        record.get(USERS.NICKNAME),
                        record.get(SESSIONS.EXPIRES_AT).toInstant()));
    }

    @Override
    public List<UserSessionView> findActiveSessions(UUID userId, UUID currentSessionId) {
        OffsetDateTime now = OffsetDateTime.ofInstant(clock.instant(), ZoneOffset.UTC);
        return dsl.select(
                        SESSIONS.ID,
                        SESSIONS.IP_ADDRESS,
                        SESSIONS.USER_AGENT,
                        SESSIONS.LAST_USED_AT,
                        SESSIONS.CREATED_AT)
                .from(SESSIONS)
                .where(SESSIONS.USER_ID.eq(userId).and(SESSIONS.EXPIRES_AT.gt(now)))
                .orderBy(SESSIONS.LAST_USED_AT.desc())
                .fetch(record -> new UserSessionView(
                        record.get(SESSIONS.ID),
                        record.get(SESSIONS.IP_ADDRESS),
                        record.get(SESSIONS.USER_AGENT),
                        record.get(SESSIONS.LAST_USED_AT).toInstant(),
                        record.get(SESSIONS.CREATED_AT).toInstant(),
                        record.get(SESSIONS.ID).equals(currentSessionId)));
    }
}
