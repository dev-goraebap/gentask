package dev.goraebap.refarch;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

/** 애플리케이션 컨텍스트가 뜨는지, 마이그레이션이 실제 PostgreSQL 에서 적용되는지 확인한다. */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class ServerApplicationTests {

    @Test
    void contextLoads() {}
}
