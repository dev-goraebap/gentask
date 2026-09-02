package xyz.gentask.module.task;

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
import jakarta.servlet.http.Cookie;
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
import xyz.gentask.AuthTestSupport;
import xyz.gentask.FakeMailConfiguration;
import xyz.gentask.TestcontainersConfiguration;
import xyz.gentask.shared.mail.E2eMailSupport.RecordingMailSender;

@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, FakeMailConfiguration.class})
@Transactional
class TaskApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RecordingMailSender mail;

    private Cookie session;

    @BeforeEach
    void 로그인한다() throws Exception {
        session = AuthTestSupport.가입한다(mockMvc, mail, "tester-" + UUID.randomUUID() + "@example.com");
    }

    @Test
    @DisplayName("로그인 없이 작업에 닿을 수 없다")
    void 로그인_없이_작업에_닿을_수_없다() throws Exception {
        mockMvc.perform(get("/api/v1/tasks"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    @DisplayName("다른 계정의 작업은 목록에도 상세에도 없다")
    void 다른_계정의_작업은_목록에도_상세에도_없다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"내 것\"}");

        Cookie other = AuthTestSupport.가입한다(mockMvc, mail, "other-" + UUID.randomUUID() + "@example.com");

        mockMvc.perform(get("/api/v1/tasks").cookie(other)).andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(get("/api/v1/tasks/{id}", taskId).cookie(other)).andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/v1/tasks/{id}", taskId).cookie(other)).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("지난 날짜도 기한으로 받는다")
    void 지난_날짜도_기한으로_받는다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"미룬 일\",\"dueDate\":\"2020-01-01\"}");

        작업을_연다(taskId).andExpect(jsonPath("$.dueDate").value("2020-01-01"));
    }

    @Test
    @DisplayName("이미 완료된 것을 다시 완료해도 완료된 작업으로 남는다")
    void 이미_완료된_것을_다시_완료해도_완료된_작업으로_남는다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"장 보기\"}");
        완료를_바꾼다(taskId, true);
        String first = 완료_시각(taskId);

        완료를_바꾼다(taskId, true);

        assertThat(완료_시각(taskId)).isEqualTo(first);
    }

    @Test
    @DisplayName("널을 보내면 기한과 미리 알림이 떨어진다")
    void 널을_보내면_기한과_미리_알림이_떨어진다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"장 보기\",\"dueDate\":\"2026-09-01\"}");

        고친다(taskId, "{\"title\":\"장 보기\",\"note\":\"\",\"dueDate\":null,\"remindAt\":null}");

        작업을_연다(taskId)
                .andExpect(jsonPath("$.dueDate").value(nullValue()))
                .andExpect(jsonPath("$.remindAt").value(nullValue()));
    }

    @Test
    @DisplayName("제목을 비우면 400 과 사유를 내고 값을 바꾸지 않는다")
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
    @DisplayName("삭제하면 204 를 내고 다시 조회하면 404 다")
    void 삭제하면_목록에_없다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"장 보기\"}");

        mockMvc.perform(delete("/api/v1/tasks/{id}", taskId).cookie(session)).andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/tasks").cookie(session)).andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(get("/api/v1/tasks/{id}", taskId).cookie(session)).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("없는 작업은 완료하지 못한다")
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
