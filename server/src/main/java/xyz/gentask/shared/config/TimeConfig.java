package xyz.gentask.shared.config;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TimeConfig {

    // 서버가 정하는 "오늘"(나의 하루)과 화면이 브라우저에서 정하는 "오늘"이 같은 날짜여야 한다.
    // UTC 로 두면 한국 시각 0시부터 9시 사이에 둘이 하루 어긋나 그 시간대에 담은 작업이
    // 나의 하루에서 사라진다. 저장하는 Instant 는 절대 시각이라 이 설정과 무관하다.
    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");

    @Bean
    Clock clock() {
        return Clock.system(ZONE);
    }
}
