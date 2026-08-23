package dev.goraebap.refarch.module.task;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.goraebap.refarch.TestcontainersConfiguration;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * 작업 API 의 경로를 처음부터 끝까지 지난다.
 *
 * <p>슬라이스 식별자를 이름에 붙이는 것은 <b>그 경로를 전부 지나는 테스트</b>뿐이다. 실제
 * 데이터베이스에 마이그레이션을 적용한 뒤 HTTP 로 들어가 응답까지 확인한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@Transactional
class TaskApiTest {

    @Autowired
    private MockMvc mvc;

    @Test
    @DisplayName("TK-001 S1: 제목을 적으면 목록에 그 작업이 있다")
    void 제목을_적으면_목록에_그_작업이_있다() throws Exception {
        mvc.perform(post("/api/v1/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"장 보기\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.title").value("장 보기"))
                // 제목만으로 만든 작업은 나머지가 정해지지 않은 상태로 시작한다.
                .andExpect(jsonPath("$.note").value(""))
                .andExpect(jsonPath("$.dueDate").doesNotExist())
                .andExpect(jsonPath("$.remindAt").doesNotExist())
                .andExpect(jsonPath("$.important").value(false))
                .andExpect(jsonPath("$.completedAt").doesNotExist());

        mvc.perform(get("/api/v1/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("장 보기"));
    }

    @Test
    @DisplayName("TK-001 A1: 제목이 비면 목록에 들어가지 않는다")
    void 제목이_비면_목록에_들어가지_않는다() throws Exception {
        mvc.perform(post("/api/v1/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"  \"}"))
                .andExpect(status().isBadRequest())
                // 필드 목록을 구조로 준다. 문자열로 이어 붙이면 클라이언트가 그것을 파싱해야 한다.
                .andExpect(jsonPath("$.errors[0].field").value("title"))
                .andExpect(jsonPath("$.errors[0].message").value("제목을 입력해 주세요"))
                .andExpect(jsonPath("$.traceId").exists());

        mvc.perform(get("/api/v1/tasks")).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("없는 작업을 열면 찾을 수 없다고 답한다")
    void 없는_작업을_열면_찾을_수_없다고_답한다() throws Exception {
        mvc.perform(get("/api/v1/tasks/{id}", "00000000-0000-0000-0000-000000000000"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("TASK_NOT_FOUND"))
                .andExpect(jsonPath("$.detail").value("작업을 찾을 수 없습니다"));
    }
}
