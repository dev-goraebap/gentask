package dev.goraebap.refarch.module.task;

import static java.util.Objects.requireNonNull;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import dev.goraebap.refarch.AuthTestSupport;
import dev.goraebap.refarch.TestcontainersConfiguration;
import jakarta.servlet.http.Cookie;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@Transactional
class TaskApiTest {

    @Autowired
    private MockMvc mockMvc;

    private Cookie session;

    @BeforeEach
    void 로그인한다() throws Exception {
        session = AuthTestSupport.가입한다(mockMvc, "tester-" + UUID.randomUUID() + "@example.com");
    }

    @Test
    @DisplayName("TK-001 S1: 제목을 적으면 목록에 그 작업이 있다")
    void 제목을_적으면_목록에_그_작업이_있다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"장 보기\"}");

        작업을_연다(taskId)
                .andExpect(jsonPath("$.title").value("장 보기"))
                .andExpect(jsonPath("$.note").value(""))
                .andExpect(jsonPath("$.dueDate").value(nullValue()))
                .andExpect(jsonPath("$.remindAt").value(nullValue()))
                .andExpect(jsonPath("$.important").value(false))
                .andExpect(jsonPath("$.completedAt").value(nullValue()));

        mockMvc.perform(get("/api/v1/tasks").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("장 보기"));
    }

    @Test
    @DisplayName("TK-005 A5: 로그인 없이 작업에 닿을 수 없다")
    void 로그인_없이_작업에_닿을_수_없다() throws Exception {
        mockMvc.perform(get("/api/v1/tasks"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    @DisplayName("TK-005: 다른 계정의 작업은 목록에도 상세에도 없다")
    void 다른_계정의_작업은_목록에도_상세에도_없다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"내 것\"}");

        Cookie other = AuthTestSupport.가입한다(mockMvc, "other-" + UUID.randomUUID() + "@example.com");

        mockMvc.perform(get("/api/v1/tasks").cookie(other)).andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(get("/api/v1/tasks/{id}", taskId).cookie(other)).andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/v1/tasks/{id}", taskId).cookie(other)).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("TK-001 A2: 기한을 붙이면 목록이 그 기한을 보여 준다")
    void 기한을_붙이면_목록이_그_기한을_보여_준다() throws Exception {
        작업을_만든다("{\"title\":\"장 보기\",\"dueDate\":\"2026-08-30\"}");

        mockMvc.perform(get("/api/v1/tasks").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].dueDate").value("2026-08-30"))
                .andExpect(jsonPath("$[0].remindAt").hasJsonPath());
    }

    @Test
    @DisplayName("TK-001 A2: 지난 날짜도 기한으로 받는다")
    void 지난_날짜도_기한으로_받는다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"미룬 일\",\"dueDate\":\"2020-01-01\"}");

        작업을_연다(taskId).andExpect(jsonPath("$.dueDate").value("2020-01-01"));
    }

    @Test
    @DisplayName("TK-001 A1: 제목이 비면 목록에 들어가지 않는다")
    void 제목이_비면_목록에_들어가지_않는다() throws Exception {
        mockMvc.perform(post("/api/v1/tasks")
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"  \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("title"))
                .andExpect(jsonPath("$.errors[0].message").value("제목을 입력해 주세요"))
                .andExpect(jsonPath("$.traceId").exists());

        mockMvc.perform(get("/api/v1/tasks").cookie(session)).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("TK-004 S1: 완료했다고 하면 완료된 작업이 된다")
    void 완료했다고_하면_완료된_작업이_된다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"장 보기\"}");

        완료를_바꾼다(taskId, true);

        작업을_연다(taskId).andExpect(jsonPath("$.completedAt").isNotEmpty());
    }

    @Test
    @DisplayName("TK-004 A2: 완료를 취소하면 완료되지 않은 작업으로 돌아간다")
    void 완료를_취소하면_완료되지_않은_작업으로_돌아간다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"장 보기\"}");
        완료를_바꾼다(taskId, true);

        완료를_바꾼다(taskId, false);

        작업을_연다(taskId).andExpect(jsonPath("$.completedAt").value(nullValue()));
    }

    @Test
    @DisplayName("TK-004 A1: 이미 완료된 것을 다시 완료해도 완료된 작업으로 남는다")
    void 이미_완료된_것을_다시_완료해도_완료된_작업으로_남는다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"장 보기\"}");
        완료를_바꾼다(taskId, true);
        String first = 완료_시각(taskId);

        완료를_바꾼다(taskId, true);

        assertThat(완료_시각(taskId)).isEqualTo(first);
    }

    @Test
    @DisplayName("TK-003 S1: 넷을 고치면 고친 대로 남는다")
    void 넷을_고치면_고친_대로_남는다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"장 보기\"}");

        고친다(
                taskId,
                "{\"title\":\"장 보기와 세탁\",\"note\":\"우유와 달걀\",\"dueDate\":\"2026-09-01\",\"remindAt\":\"2026-09-01T09:00\"}");

        작업을_연다(taskId)
                .andExpect(jsonPath("$.title").value("장 보기와 세탁"))
                .andExpect(jsonPath("$.note").value("우유와 달걀"))
                .andExpect(jsonPath("$.dueDate").value("2026-09-01"))
                .andExpect(jsonPath("$.remindAt").value("2026-09-01T09:00"));
    }

    @Test
    @DisplayName("TK-003 A3 · A10: 널을 보내면 기한과 미리 알림이 떨어진다")
    void 널을_보내면_기한과_미리_알림이_떨어진다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"장 보기\",\"dueDate\":\"2026-09-01\"}");

        고친다(taskId, "{\"title\":\"장 보기\",\"note\":\"\",\"dueDate\":null,\"remindAt\":null}");

        작업을_연다(taskId)
                .andExpect(jsonPath("$.dueDate").value(nullValue()))
                .andExpect(jsonPath("$.remindAt").value(nullValue()));
    }

    @Test
    @DisplayName("TK-003 A1: 제목을 비우면 고치지 않는다")
    void 제목을_비우면_고치지_않는다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"장 보기\"}");

        mockMvc.perform(patch("/api/v1/tasks/{id}", taskId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"  \",\"note\":\"\",\"dueDate\":null,\"remindAt\":null}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].message").value("제목을 입력해 주세요"));

        작업을_연다(taskId).andExpect(jsonPath("$.title").value("장 보기"));
    }

    @Test
    @DisplayName("TK-003 A4: 중요 표시를 켜고 끈다")
    void 중요_표시를_켜고_끈다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"장 보기\"}");

        하위_자원을_바꾼다(taskId, "importance", "{\"important\":true}");
        작업을_연다(taskId).andExpect(jsonPath("$.important").value(true));

        하위_자원을_바꾼다(taskId, "importance", "{\"important\":false}");
        작업을_연다(taskId).andExpect(jsonPath("$.important").value(false));
    }

    @Test
    @DisplayName("TK-003 A5: 나의 하루에 담으면 담은 날짜가 붙는다")
    void 나의_하루에_담으면_담은_날짜가_붙는다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"장 보기\"}");

        하위_자원을_바꾼다(taskId, "my-day", "{\"inMyDay\":true}");
        작업을_연다(taskId)
                .andExpect(jsonPath("$.myDayOn")
                        .value(LocalDate.now(ZoneOffset.UTC).toString()));

        하위_자원을_바꾼다(taskId, "my-day", "{\"inMyDay\":false}");
        작업을_연다(taskId).andExpect(jsonPath("$.myDayOn").value(nullValue()));
    }

    @Test
    @DisplayName("TK-003 A6: 삭제하면 목록에 없다")
    void 삭제하면_목록에_없다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"장 보기\"}");

        mockMvc.perform(delete("/api/v1/tasks/{id}", taskId).cookie(session)).andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/tasks").cookie(session)).andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(get("/api/v1/tasks/{id}", taskId).cookie(session)).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("TK-003 A8: 없는 작업은 고치지 못한다")
    void 없는_작업은_고치지_못한다() throws Exception {
        mockMvc.perform(patch("/api/v1/tasks/{id}/completion", "00000000-0000-0000-0000-000000000000")
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\":true}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("TASK_NOT_FOUND"));
    }

    private String 작업을_만든다(String body) throws Exception {
        String location = requireNonNull(mockMvc.perform(post("/api/v1/tasks")
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andReturn()
                .getResponse()
                .getHeader("Location"));
        return location.substring(location.lastIndexOf("/") + 1);
    }

    private ResultActions 작업을_연다(String taskId) throws Exception {
        return mockMvc.perform(get("/api/v1/tasks/{id}", taskId).cookie(session))
                .andExpect(status().isOk());
    }

    private String 완료_시각(String taskId) throws Exception {
        String body = 작업을_연다(taskId).andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.completedAt");
    }

    private void 완료를_바꾼다(String taskId, boolean completed) throws Exception {
        하위_자원을_바꾼다(taskId, "completion", "{\"completed\":" + completed + "}");
    }

    private void 하위_자원을_바꾼다(String taskId, String sub, String body) throws Exception {
        mockMvc.perform(patch("/api/v1/tasks/{id}/{sub}", taskId, sub)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNoContent());
    }

    private void 고친다(String taskId, String body) throws Exception {
        mockMvc.perform(patch("/api/v1/tasks/{id}", taskId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNoContent());
    }
}
