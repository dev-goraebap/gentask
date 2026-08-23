package dev.goraebap.refarch.shared.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 시각의 출처.
 *
 * <p>데이터베이스 기본값이 아니라 주입된 시계에서 받는다. 만료와 수명에 관한 불변식은 시각을
 * 통제할 수 있어야 검증되는데, 데이터베이스가 시각을 채우면 테스트가 그것을 앞뒤로 옮길 수 없어
 * 그 규칙이 검증 대상에서 빠진다.
 *
 * <p>UTC 로 고정한다. 저장하는 순간은 절대 시각이며, 지역 시각이 필요한 값은 그 타입이 따로 있다.
 */
@Configuration
public class TimeConfig {

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}
