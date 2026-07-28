package dev.goraebap.devkit.auth.infrastructure.repository;

import static dev.goraebap.devkit.jooq.Tables.SESSIONS;
import static dev.goraebap.devkit.jooq.Tables.VERIFICATIONS;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 만료된 세션·대기 레코드 정리 (설계/데이터베이스.md §5).
 *
 * <p>정리가 밀려도 정확성에는 영향이 없다 — 만료 판정은 조회 시점에 하고, 이것은 용량 관리다.
 * 두 테이블 모두 {@code expires_at}에 인덱스가 있다.
 *
 * <p>파생 프로젝트가 여러 인스턴스로 배포하면 중복 실행 방지(분산 잠금)가 필요해진다. 중복 실행
 * 자체는 무해하지만(같은 행을 지운다) 불필요한 부하다.
 */
@Slf4j
@Component
class ExpiredRowPruner {

    private final DSLContext dsl;
    private final Clock clock;

    ExpiredRowPruner(DSLContext dsl, Clock clock) {
        this.dsl = dsl;
        this.clock = clock;
    }

    /** 매일 03:15. 트래픽이 낮은 시간대를 고른다. */
    @Scheduled(cron = "0 15 3 * * *")
    void prune() {
        OffsetDateTime now = OffsetDateTime.ofInstant(clock.instant(), ZoneOffset.UTC);
        int sessions =
                dsl.deleteFrom(SESSIONS).where(SESSIONS.EXPIRES_AT.lt(now)).execute();
        int verifications = dsl.deleteFrom(VERIFICATIONS)
                .where(VERIFICATIONS.EXPIRES_AT.lt(now))
                .execute();
        log.info("만료 행 정리 완료 (sessions={}, verifications={})", sessions, verifications);
    }
}
