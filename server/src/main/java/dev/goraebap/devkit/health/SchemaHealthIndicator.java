package dev.goraebap.devkit.health;

import static dev.goraebap.devkit.jooq.Tables.HEALTH_CHECK;

import org.jooq.DSLContext;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

/**
 * 마이그레이션된 스키마를 실제로 읽을 수 있는지 확인한다.
 *
 * <p>기본 DB 검사는 커넥션 유효성만 보지만, 이 검사는 Flyway가 적용한 스키마를 jOOQ 생성 코드로
 * 실제 조회한다 — 마이그레이션·코드 생성·조회 경로가 런타임에 이어져 있음을 확인한다.
 */
@Component
public class SchemaHealthIndicator implements HealthIndicator {

    private final DSLContext dsl;

    public SchemaHealthIndicator(DSLContext dsl) {
        this.dsl = dsl;
    }

    @Override
    public Health health() {
        String note = dsl.select(HEALTH_CHECK.NOTE)
                .from(HEALTH_CHECK)
                .where(HEALTH_CHECK.ID.eq(1))
                .fetchOne(HEALTH_CHECK.NOTE);

        return note == null
                ? Health.down().withDetail("schema", "health_check 기준 행 없음").build()
                : Health.up().withDetail("schema", note).build();
    }
}
