package dev.goraebap.devkit;

import org.junit.jupiter.api.Test;

class ApplicationTests extends IntegrationTestSupport {

    @Test
    void 애플리케이션_컨텍스트가_기동된다() {
        // 컨텍스트 기동 자체가 검증 대상이다.
        // Flyway 마이그레이션 적용과 jOOQ DSLContext 구성이 여기서 함께 확인된다.
    }
}
