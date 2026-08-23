package dev.goraebap.refarch;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

/**
 * 명세를 파일로 떨어뜨린다. 프론트엔드가 이 파일에서 타입을 생성한다.
 *
 * 별도 도구가 아니라 테스트가 하는 이유는 명세가 실제로 뜬 애플리케이션에서 나와야 하기
 * 때문이다. 정적 분석으로 만들면 뜨지 않는 구성에서도 명세가 나오고, 그 명세를 믿은
 * 프론트엔드는 런타임에야 어긋남을 안다.
 *
 * 결과 파일은 커밋한다. 프론트엔드의 타입 생성이 백엔드를 띄우지 않아도 되게 한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class OpenApiSpecTest {

    private static final Path SPEC = Path.of("openapi.json");

    @Autowired
    private MockMvc mockMvc;

    @Test
    void 명세를_발행한다() throws Exception {
        String spec = mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertThat(spec).contains("/api/v1/tasks");
        Files.writeString(SPEC, spec);
    }
}
