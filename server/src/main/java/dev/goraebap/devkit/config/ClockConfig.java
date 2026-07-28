package dev.goraebap.devkit.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 전역 {@link Clock} 빈 (설계/서버.md §3, 데이터베이스.md §1.3).
 *
 * <p>시각은 DB 기본값이 아니라 애플리케이션이 주입된 Clock으로 채운다 — 테스트가 시각을 통제할 수
 * 있어야 하기 때문이다.
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
