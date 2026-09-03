package xyz.gentask.shared.config;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TimeConfig {

    // 서버와 클라이언트 간 "오늘" 날짜 일관성을 위해 기본 시간대를 Asia/Seoul로 설정한다.
    // 데이터베이스에 저장되는 Instant 절대 시각에는 영향을 주지 않는다.
    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");

    @Bean
    Clock clock() {
        return Clock.system(ZONE);
    }
}
