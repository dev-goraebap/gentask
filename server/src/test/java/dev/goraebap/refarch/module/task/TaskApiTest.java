package dev.goraebap.refarch.module.task;

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
import dev.goraebap.refarch.TestcontainersConfiguration;
import java.time.LocalDate;
import java.time.ZoneOffset;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@Transactional
class TaskApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("TK-001 S1: 제목을 적으면 목록에 그 작업이 있다")
    void 제목을_적으면_목록에_그_작업이_있다() throws Exception {
        mockMvc.perform(post("/api/v1/tasks")
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

        mockMvc.perform(get("/api/v1/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("장 보기"));
    }

    @Test
    @DisplayName("TK-001 A2: 기한을 붙이면 목록이 그 기한을 보여 준다")
    void 기한을_붙이면_목록이_그_기한을_보여_준다() throws Exception {
        mockMvc.perform(post("/api/v1/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"장 보기\",\"dueDate\":\"2026-08-30\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.dueDate").value("2026-08-30"))
                // 정하지 않은 값의 키는 빠지지 않는다. 오타와 미구현이 같은 모양이 되지 않게 한다.
                .andExpect(jsonPath("$.remindAt").hasJsonPath());

        mockMvc.perform(get("/api/v1/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].dueDate").value("2026-08-30"));
    }

    @Test
    @DisplayName("TK-001 A2: 지난 날짜도 기한으로 받는다")
    void 지난_날짜도_기한으로_받는다() throws Exception {
        mockMvc.perform(post("/api/v1/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"미룬 일\",\"dueDate\":\"2020-01-01\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.dueDate").value("2020-01-01"));
    }

    @Test
    @DisplayName("TK-001 A1: 제목이 비면 목록에 들어가지 않는다")
    void 제목이_비면_목록에_들어가지_않는다() throws Exception {
        mockMvc.perform(post("/api/v1/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"  \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("title"))
                .andExpect(jsonPath("$.errors[0].message").value("제목을 입력해 주세요"))
                .andExpect(jsonPath("$.traceId").exists());

        mockMvc.perform(get("/api/v1/tasks")).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("없는 작업을 열면 찾을 수 없다고 답한다")
    void 없는_작업을_열면_찾을_수_없다고_답한다() throws Exception {
        mockMvc.perform(get("/api/v1/tasks/{id}", "00000000-0000-0000-0000-000000000000"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("TASK_NOT_FOUND"))
                .andExpect(jsonPath("$.detail").value("작업을 찾을 수 없습니다"));
    }

    @Test
    @DisplayName("TK-004 S1: 완료했다고 하면 완료된 작업이 된다")
    void 완료했다고_하면_완료된_작업이_된다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"장 보기\"}");

        mockMvc.perform(patch("/api/v1/tasks/{id}/completion", taskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedAt").isNotEmpty());
    }

    @Test
    @DisplayName("TK-004 A2: 완료를 취소하면 완료되지 않은 작업으로 돌아간다")
    void 완료를_취소하면_완료되지_않은_작업으로_돌아간다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"장 보기\"}");
        완료를_바꾼다(taskId, true);

        mockMvc.perform(patch("/api/v1/tasks/{id}/completion", taskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedAt").value(nullValue()));
    }

    @Test
    @DisplayName("TK-004 A1: 이미 완료된 것을 다시 완료해도 완료된 작업으로 남는다")
    void 이미_완료된_것을_다시_완료해도_완료된_작업으로_남는다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"장 보기\"}");
        String first = 완료를_바꾼다(taskId, true);

        String again = 완료를_바꾼다(taskId, true);

        assertThat(JsonPath.<String>read(again, "$.completedAt")).isEqualTo(JsonPath.read(first, "$.completedAt"));
    }

    @Test
    @DisplayName("TK-003 S1: 넷을 고치면 고친 대로 남는다")
    void 넷을_고치면_고친_대로_남는다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"장 보기\"}");

        mockMvc.perform(
                        patch("/api/v1/tasks/{id}", taskId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"title\":\"장 보기와 세탁\",\"note\":\"우유와 달걀\",\"dueDate\":\"2026-09-01\",\"remindAt\":\"2026-09-01T09:00\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("장 보기와 세탁"))
                .andExpect(jsonPath("$.note").value("우유와 달걀"))
                .andExpect(jsonPath("$.dueDate").value("2026-09-01"))
                .andExpect(jsonPath("$.remindAt").value("2026-09-01T09:00"));
    }

    @Test
    @DisplayName("TK-003 A3 · A10: 널을 보내면 기한과 미리 알림이 떨어진다")
    void 널을_보내면_기한과_미리_알림이_떨어진다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"장 보기\",\"dueDate\":\"2026-09-01\"}");

        mockMvc.perform(patch("/api/v1/tasks/{id}", taskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"장 보기\",\"note\":\"\",\"dueDate\":null,\"remindAt\":null}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueDate").value(nullValue()))
                .andExpect(jsonPath("$.remindAt").value(nullValue()));
    }

    @Test
    @DisplayName("TK-003 A1: 제목을 비우면 고치지 않는다")
    void 제목을_비우면_고치지_않는다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"장 보기\"}");

        mockMvc.perform(patch("/api/v1/tasks/{id}", taskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"  \",\"note\":\"\",\"dueDate\":null,\"remindAt\":null}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].message").value("제목을 입력해 주세요"));

        mockMvc.perform(get("/api/v1/tasks/{id}", taskId))
                .andExpect(jsonPath("$.title").value("장 보기"));
    }

    @Test
    @DisplayName("TK-003 A4: 중요 표시를 켜고 끈다")
    void 중요_표시를_켜고_끈다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"장 보기\"}");

        mockMvc.perform(patch("/api/v1/tasks/{id}/importance", taskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"important\":true}"))
                .andExpect(jsonPath("$.important").value(true));

        mockMvc.perform(patch("/api/v1/tasks/{id}/importance", taskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"important\":false}"))
                .andExpect(jsonPath("$.important").value(false));
    }

    @Test
    @DisplayName("TK-003 A5: 나의 하루에 담으면 담은 날짜가 붙는다")
    void 나의_하루에_담으면_담은_날짜가_붙는다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"장 보기\"}");

        mockMvc.perform(patch("/api/v1/tasks/{id}/my-day", taskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"inMyDay\":true}"))
                .andExpect(jsonPath("$.myDayOn")
                        .value(LocalDate.now(ZoneOffset.UTC).toString()));

        mockMvc.perform(patch("/api/v1/tasks/{id}/my-day", taskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"inMyDay\":false}"))
                .andExpect(jsonPath("$.myDayOn").value(nullValue()));
    }

    @Test
    @DisplayName("TK-003 A6: 삭제하면 목록에 없다")
    void 삭제하면_목록에_없다() throws Exception {
        String taskId = 작업을_만든다("{\"title\":\"장 보기\"}");

        mockMvc.perform(delete("/api/v1/tasks/{id}", taskId)).andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/tasks")).andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(get("/api/v1/tasks/{id}", taskId)).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("TK-003 A8: 없는 작업은 고치지 못한다")
    void 없는_작업은_고치지_못한다() throws Exception {
        mockMvc.perform(patch("/api/v1/tasks/{id}/completion", "00000000-0000-0000-0000-000000000000")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\":true}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("TASK_NOT_FOUND"));
    }

    private String 작업을_만든다(String body) throws Exception {
        String created = mockMvc.perform(post("/api/v1/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return JsonPath.read(created, "$.id");
    }

    private String 완료를_바꾼다(String taskId, boolean completed) throws Exception {
        return mockMvc.perform(patch("/api/v1/tasks/{id}/completion", taskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\":" + completed + "}"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
    }
}
