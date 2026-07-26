package dev.goraebap.devkit;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * 통합 테스트 기반 클래스.
 *
 * <p>공유 개발 DB를 쓰지 않고 1회용 PostgreSQL 컨테이너를 띄운다(설계/서버.md §9). Flyway는
 * 애플리케이션 기동 시 이 컨테이너에 마이그레이션을 적용한다.
 *
 * <p>컨테이너는 <b>싱글턴 패턴</b>으로 직접 기동한다 — JUnit의 {@code @Testcontainers} 확장은
 * 컨테이너를 클래스 단위로 정리하므로, 여러 테스트 클래스가 static 필드를 공유하면 첫 클래스가
 * 끝날 때 컨테이너가 내려가고 다음 클래스가 죽은 컨테이너에 접속한다. 여기서는 JVM 수명 동안
 * 하나를 유지하고 정리는 Testcontainers의 리퍼(Ryuk)에 맡긴다.
 */
@SpringBootTest
public abstract class IntegrationTestSupport {

    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    static {
        POSTGRES.start();
    }
}
