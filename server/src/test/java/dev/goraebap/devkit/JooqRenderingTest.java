package dev.goraebap.devkit;

import static dev.goraebap.devkit.jooq.Tables.HEALTH_CHECK;
import static org.assertj.core.api.Assertions.assertThat;

import org.jooq.SQLDialect;
import org.jooq.impl.DSL;
import org.junit.jupiter.api.Test;

/**
 * 생성 코드가 PostgreSQL에 맞는 SQL로 렌더링되는지 확인한다.
 *
 * <p>코드 생성은 인메모리 H2를 거치므로(DDLDatabase) 스키마 이름이 대문자 PUBLIC으로 잡힌다.
 * 매핑이 빠지면 {@code "PUBLIC"."health_check"}로 렌더링되어 런타임에야 문법 오류로 드러난다.
 * 이 테스트는 DB 없이 도는 빠른 방어선이다.
 */
class JooqRenderingTest {

    @Test
    void 생성된_테이블은_소문자_public_스키마로_렌더링된다() {
        String sql = DSL.using(SQLDialect.POSTGRES)
                .select(HEALTH_CHECK.NOTE)
                .from(HEALTH_CHECK)
                .getSQL();

        assertThat(sql).contains("\"public\".\"health_check\"").doesNotContain("\"PUBLIC\"");
    }
}
