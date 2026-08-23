package dev.goraebap.refarch.shared.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** 데이터베이스 기본값이 아니라 주입된 시계에서 받는다. UTC 로 고정한다. */
@Configuration
public class TimeConfig {

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}
