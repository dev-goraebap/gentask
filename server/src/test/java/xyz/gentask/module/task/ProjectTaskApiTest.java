package xyz.gentask.module.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.AuthTestSupport;
import xyz.gentask.FakeMailConfiguration;
import xyz.gentask.TestcontainersConfiguration;
import xyz.gentask.shared.mail.E2eMailSupport.RecordingMailSender;

@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, FakeMailConfiguration.class})
@Transactional
class ProjectTaskApiTest {
    @Autowired
    private MockMvc mvc;

    @Autowired
    private RecordingMailSender mail;

    @Test
    void 할당한_프로젝트_작업은_개인_목록과_같은_상태를_보여준다() throws Exception {
        Cookie owner = user();
        Cookie editor = user();
        Cookie outsider = user();
        String project = create(owner, "/projects", "{\"name\":\"협업 작업\",\"key\":\"WORK\"}");
        join(owner, editor, project, "editor");
        String editorId = userId(editor);
        String task = create(owner, "/projects/" + project + "/tasks", "{\"title\":\"문서 검토\"}");
        String personal = create(editor, "/tasks", "{\"title\":\"개인 할 일\"}");
        mvc.perform(get("/api/v1/tasks").cookie(editor))
                .andExpect(jsonPath("$.length()").value(1));
        mvc.perform(patch("/api/v1/tasks/" + task + "/assignee")
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"assigneeId\":\"" + editorId + "\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/tasks").cookie(editor))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[?(@.id == '" + task + "')].projectId").value(project));
        mvc.perform(patch("/api/v1/tasks/" + task + "/state")
                        .cookie(editor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"state\":\"DONE\"}"))
                .andExpect(status().isNoContent());
        String completion = JsonPath.read(
                mvc.perform(get("/api/v1/tasks/" + task).cookie(owner))
                        .andExpect(jsonPath("$.state").value("DONE"))
                        .andReturn()
                        .getResponse()
                        .getContentAsString(),
                "$.completedAt");
        mvc.perform(patch("/api/v1/tasks/" + task + "/state")
                        .cookie(editor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"state\":\"DONE\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/tasks/" + task).cookie(owner))
                .andExpect(jsonPath("$.completedAt").value(completion));
        mvc.perform(get("/api/v1/projects/" + project + "/tasks").cookie(editor))
                .andExpect(jsonPath("$[0].state").value("DONE"))
                .andExpect(jsonPath("$.length()").value(1));
        mvc.perform(get("/api/v1/tasks/" + personal).cookie(owner)).andExpect(status().isNotFound());
        mvc.perform(patch("/api/v1/tasks/" + task + "/assignee")
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"assigneeId\":\"" + userId(outsider) + "\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(patch("/api/v1/tasks/" + task + "/state")
                        .cookie(outsider)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"state\":\"TODO\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/v1/projects/" + project + "/members/" + editorId)
                        .cookie(owner))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/tasks").cookie(editor))
                .andExpect(jsonPath("$.length()").value(1));
        for (String suffix : new String[] {"", "/files", "/artifacts"})
            mvc.perform(get("/api/v1/tasks/" + task + suffix).cookie(editor)).andExpect(status().isNotFound());
    }

    @Test
    void 읽기_멤버는_작업을_읽지만_상태와_첨부를_변경할_수_없다() throws Exception {
        Cookie owner = user(), viewer = user();
        String project = create(owner, "/projects", "{\"name\":\"읽기 권한\",\"key\":\"READ\"}");
        join(owner, viewer, project, "viewer");
        String task = create(owner, "/projects/" + project + "/tasks", "{\"title\":\"읽기 작업\"}");
        mvc.perform(get("/api/v1/tasks/" + task).cookie(viewer)).andExpect(status().isOk());
        mvc.perform(post("/api/v1/projects/" + project + "/tasks")
                        .cookie(viewer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"거절\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(patch("/api/v1/tasks/" + task + "/state")
                        .cookie(viewer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"state\":\"IN_PROGRESS\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/tasks/" + task).cookie(viewer)).andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/tasks/" + task + "/files/" + UUID.randomUUID())
                        .cookie(viewer))
                .andExpect(status().isForbidden());
        mvc.perform(patch("/api/v1/tasks/" + task + "/state")
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"state\":\"INVALID\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void 아티팩트는_같은_소속끼리_연결하고_최신_제목을_조회한다() throws Exception {
        Cookie owner = user(), other = user();
        String project = create(owner, "/projects", "{\"name\":\"문서 연결\",\"key\":\"LINK\"}");
        String second = create(owner, "/projects", "{\"name\":\"다른 프로젝트\",\"key\":\"OTHER\"}");
        String task = create(owner, "/projects/" + project + "/tasks", "{\"title\":\"구현\"}");
        String personalTask = create(owner, "/tasks", "{\"title\":\"개인\"}");
        String doc = create(owner, "/projects/" + project + "/artifacts", "{\"title\":\"요구사항\",\"body\":\"본문\"}");
        String foreign = create(owner, "/projects/" + second + "/artifacts", "{\"title\":\"다른 문서\",\"body\":\"본문\"}");
        String personal = create(owner, "/me/artifacts", "{\"title\":\"개인 문서\",\"body\":\"본문\"}");
        for (int i = 0; i < 2; i++)
            mvc.perform(put("/api/v1/tasks/" + task + "/artifacts/" + doc).cookie(owner))
                    .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/tasks/" + task + "/artifacts").cookie(owner))
                .andExpect(jsonPath("$.length()").value(1));
        for (String id : new String[] {foreign, personal})
            mvc.perform(put("/api/v1/tasks/" + task + "/artifacts/" + id).cookie(owner))
                    .andExpect(status().isNotFound());
        mvc.perform(put("/api/v1/tasks/" + personalTask + "/artifacts/" + doc).cookie(owner))
                .andExpect(status().isNotFound());
        mvc.perform(put("/api/v1/tasks/" + personalTask + "/artifacts/" + personal)
                        .cookie(owner))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/tasks/" + personalTask + "/artifacts").cookie(other))
                .andExpect(status().isNotFound());
        mvc.perform(patch("/api/v1/projects/" + project + "/artifacts/" + doc)
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"최신 요구사항\",\"body\":\"수정\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/tasks/" + task + "/artifacts").cookie(owner))
                .andExpect(jsonPath("$[0].title").value("최신 요구사항"));
        mvc.perform(delete("/api/v1/tasks/" + task + "/artifacts/" + doc).cookie(owner))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/tasks/" + task + "/artifacts").cookie(owner))
                .andExpect(jsonPath("$.length()").value(0));
    }

    private Cookie user() throws Exception {
        return AuthTestSupport.가입한다(mvc, mail, "task-" + UUID.randomUUID() + "@example.com");
    }

    private String userId(Cookie user) throws Exception {
        return JsonPath.read(
                mvc.perform(get("/api/v1/me").cookie(user))
                        .andReturn()
                        .getResponse()
                        .getContentAsString(),
                "$.id");
    }

    private String create(Cookie user, String path, String body) throws Exception {
        String location = mvc.perform(post("/api/v1" + path)
                        .cookie(user)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location");
        assertThat(location).isNotNull();
        return location.substring(location.lastIndexOf('/') + 1);
    }

    private void join(Cookie owner, Cookie member, String project, String role) throws Exception {
        String body = mvc.perform(post("/api/v1/projects/" + project + "/invitations")
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"label\":\"작업 테스트\",\"role\":\"" + role + "\",\"days\":7}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String token = JsonPath.read(body, "$.token");
        mvc.perform(post("/api/v1/invitations/" + token + "/accept").cookie(member))
                .andExpect(status().isOk());
    }
}
