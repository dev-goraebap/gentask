package dev.goraebap.devkit;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * 통합 테스트 기반 클래스.
 *
 * <p>공유 개발 DB를 쓰지 않고 1회용 PostgreSQL 컨테이너를 띄운다(설계/서버.md §9). 컨테이너는
 * static이므로 이 클래스를 상속하는 테스트들이 하나를 공유한다. Flyway는 애플리케이션 기동 시
 * 이 컨테이너에 마이그레이션을 적용한다.
 */
@SpringBootTest
@Testcontainers
public abstract class IntegrationTestSupport {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");
}
