package dev.goraebap.devkit.health;

import static org.assertj.core.api.Assertions.assertThat;

import dev.goraebap.devkit.IntegrationTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.health.contributor.Status;

class SchemaHealthIndicatorTest extends IntegrationTestSupport {

    @Autowired
    private SchemaHealthIndicator indicator;

    @Test
    void 마이그레이션된_스키마를_jOOQ_생성_코드로_읽는다() {
        var health = indicator.health();

        assertThat(health.getStatus()).isEqualTo(Status.UP);
        assertThat(health.getDetails()).containsEntry("schema", "ok");
    }
}
