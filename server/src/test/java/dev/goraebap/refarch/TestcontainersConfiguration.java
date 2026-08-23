package dev.goraebap.refarch;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * 통합 테스트가 쓰는 데이터베이스.
 *
 * <p>로컬 개발용 컨테이너(compose.yaml)와 분리한다. 테스트가 개발 중인 데이터베이스를 쓰면
 * 남아 있던 데이터에 따라 결과가 갈리고, 테스트가 그것을 지우면 개발하던 상태가 사라진다.
 *
 * <p>이미지 태그를 compose.yaml 과 맞춘다. 다른 판을 쓰면 로컬에서 통과한 마이그레이션이
 * 테스트에서 실패하는 일이 생기는데, 원인이 스키마가 아니라 판 차이라 찾기 어렵다.
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

    @Bean
    @ServiceConnection
    PostgreSQLContainer<?> postgresContainer() {
        return new PostgreSQLContainer<>(DockerImageName.parse("postgres:17-alpine"));
    }
}
