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
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Component;

/** 조회 어댑터 — SQL은 여기서만 보인다 (docs/references/조회와-명령.md §1). */
@Component
@RequiredArgsConstructor
class JooqSessionQueries implements SessionQueries {

    /**
     * 기기 목록의 상한. 사람이 실제로 훑어보는 개수를 넘어서면 목록으로서 쓸모가 없고,
     * 그 이상은 "전부 로그아웃"으로 처리하는 편이 낫다.
     */
    private static final int ACTIVE_SESSION_LIMIT = 50;

    private final DSLContext dsl;
    private final Clock clock;

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
                // 상한을 둔다 (검토 #32-4). 세션 절대 수명이 90일이라 한 사용자가 수백 개를 쌓을
                // 수 있고, 그것을 통째로 직렬화해 내려주면 응답이 커지고 화면도 읽을 수 없게 된다.
                // 최근에 쓴 것부터 자르므로 사용자가 알아볼 기기는 목록 안에 남는다.
                .limit(ACTIVE_SESSION_LIMIT)
                .fetch(record -> new UserSessionView(
                        record.get(SESSIONS.ID),
                        record.get(SESSIONS.IP_ADDRESS),
                        record.get(SESSIONS.USER_AGENT),
                        record.get(SESSIONS.LAST_USED_AT).toInstant(),
                        record.get(SESSIONS.CREATED_AT).toInstant(),
                        record.get(SESSIONS.ID).equals(currentSessionId)));
    }
}
