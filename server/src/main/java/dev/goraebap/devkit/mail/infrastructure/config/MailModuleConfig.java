package dev.goraebap.devkit.mail.infrastructure.config;

import dev.goraebap.devkit.mail.infrastructure.smtp.MailFromProperties;
import java.util.concurrent.ThreadPoolExecutor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * 메일 발송 전용 executor (MAIL-01, 결정-0016 §결정 2).
 *
 * <p>공용 풀을 쓰지 않는다 — 메일 발송의 지연·적체가 다른 비동기 작업을 잠식하지 않게 한다.
 * 큐가 가득 차면 호출 스레드에서 실행되어(CallerRuns) 메일을 버리지 않는다.
 */
@Configuration
@EnableAsync
@EnableConfigurationProperties(MailFromProperties.class)
class MailModuleConfig {

    @Bean(name = "mailExecutor")
    ThreadPoolTaskExecutor mailExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setThreadNamePrefix("mail-");
        executor.setCorePoolSize(1);
        executor.setMaxPoolSize(2);
        executor.setQueueCapacity(100);
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        return executor;
    }
}
