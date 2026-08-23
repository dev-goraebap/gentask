package dev.goraebap.refarch;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

/**
 * 애플리케이션 컨텍스트가 뜨는지 확인한다.
 *
 * <p>데이터베이스가 필요하므로 컨테이너를 함께 띄운다. 이 테스트는 마이그레이션이 실제
 * PostgreSQL 에서 적용되는지도 함께 확인한다 — 코드 생성은 SQL 파서를 통과하는 것까지만
 * 보장하고, 데이터베이스 고유 구문의 실행 가능 여부는 보장하지 않는다.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class ServerApplicationTests {

    @Test
    void contextLoads() {}
}
