package dev.goraebap.devkit.auth.infrastructure.security;

import dev.goraebap.devkit.auth.application.shared.AttemptRateLimiter;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Component;

/**
 * 고정 윈도우 인메모리 rate limiter.
 *
 * <p>단일 인스턴스 전제의 키트 구현이다 — 여러 인스턴스로 배포하는 파생 프로젝트는 공유 저장소
 * (Redis 등) 구현으로 교체한다. 포트 뒤에 있으므로 교체는 이 클래스 하나다.
 */
@Component
class InMemoryAttemptRateLimiter implements AttemptRateLimiter {

    private static final int CLEANUP_THRESHOLD = 10_000;

    private final ConcurrentHashMap<String, Window> counters = new ConcurrentHashMap<>();
    private final Clock clock;

    InMemoryAttemptRateLimiter(Clock clock) {
        this.clock = clock;
    }

    @Override
    public boolean tryAcquire(String key, int limit, Duration window) {
        Instant now = clock.instant();
        cleanupIfBloated(now);
        Window current = counters.compute(key, (ignored, existing) -> {
            if (existing == null || existing.expiresAt().isBefore(now)) {
                return new Window(now.plus(window), new AtomicInteger(0));
            }
            return existing;
        });
        return current.count().incrementAndGet() <= limit;
    }

    @Override
    public void reset(String key) {
        counters.remove(key);
    }

    private void cleanupIfBloated(Instant now) {
        if (counters.size() > CLEANUP_THRESHOLD) {
            counters.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
        }
    }

    private record Window(Instant expiresAt, AtomicInteger count) {}
}
