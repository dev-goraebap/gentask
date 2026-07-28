package dev.goraebap.devkit.auth.infrastructure.query;

import static dev.goraebap.devkit.jooq.Tables.SESSIONS;
import static dev.goraebap.devkit.jooq.Tables.USERS;

import dev.goraebap.devkit.auth.application.session.CurrentSessionView;
import dev.goraebap.devkit.auth.application.session.SessionQueries;
import java.util.Optional;
import java.util.UUID;
import org.jooq.DSLContext;
import org.springframework.stereotype.Component;

/** 조회 어댑터 — SQL은 여기서만 보인다 (설계/서버.md §5.1). */
@Component
class JooqSessionQueries implements SessionQueries {

    private final DSLContext dsl;

    JooqSessionQueries(DSLContext dsl) {
        this.dsl = dsl;
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
}
