package xyz.gentask;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static xyz.gentask.jooq.Tables.PROJECT_MEMBERS;

import jakarta.servlet.http.Cookie;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;
import xyz.gentask.shared.mail.E2eMailSupport.RecordingMailSender;

@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, FakeMailConfiguration.class, FakeStorageConfiguration.class})
@Transactional
class ResourceScopeApiTest {
    @Autowired
    MockMvc mvc;

    @Autowired
    RecordingMailSender mail;

    @Autowired
    JsonMapper json;

    @Autowired
    DSLContext dsl;

    Cookie owner, viewer, outsider;
    String project;

    @BeforeEach
    void prepare() throws Exception {
        owner = user();
        viewer = user();
        outsider = user();
        project = json.readTree(mvc.perform(get("/api/v1/projects").cookie(owner))
                        .andReturn()
                        .getResponse()
                        .getContentAsString())
                .get(0)
                .get("id")
                .asText();
        String viewerId = json.readTree(mvc.perform(get("/api/v1/me").cookie(viewer))
                        .andReturn()
                        .getResponse()
                        .getContentAsString())
                .get("id")
                .asText();
        dsl.insertInto(PROJECT_MEMBERS)
                .set(PROJECT_MEMBERS.PROJECT_ID, project)
                .set(PROJECT_MEMBERS.USER_ID, UUID.fromString(viewerId))
                .set(PROJECT_MEMBERS.ROLE, "viewer")
                .set(PROJECT_MEMBERS.JOINED_AT, Instant.now())
                .execute();
    }

    @Test
    void 전체와_개인과_프로젝트_범위를_구분하고_외부_자료를_제외한다() throws Exception {
        for (String resource : new String[] {"tasks", "artifacts", "artifact-folders"}) {
            String field = resource.equals("artifact-folders") ? "name" : "title";
            String personal = create(owner, resource, Map.of(field, "own-personal"));
            String shared = create(owner, resource, Map.of(field, "own-project", "projectId", project));
            String foreign = create(outsider, resource, Map.of(field, "outsider-private"));
            String all = read(owner, "/api/v1/" + resource);
            assertThat(all).contains(id(personal), id(shared)).doesNotContain(id(foreign));
            assertThat(read(owner, "/api/v1/" + resource + "?scope=personal"))
                    .contains(id(personal))
                    .doesNotContain(id(shared));
            assertThat(read(owner, "/api/v1/" + resource + "?projectId=" + project))
                    .contains(id(shared))
                    .doesNotContain(id(personal));
            assertThat(read(viewer, "/api/v1/" + resource)).contains(id(shared)).doesNotContain(id(personal));
            mvc.perform(get("/api/v1/" + resource).cookie(outsider).param("projectId", project))
                    .andExpect(status().isNotFound());
            mvc.perform(get("/api/v1/" + resource)
                            .cookie(owner)
                            .param("projectId", project)
                            .param("scope", "personal"))
                    .andExpect(status().isBadRequest());
            mvc.perform(get("/api/v1/" + resource).cookie(owner).param("scope", "unknown"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void 아티팩트_ID로_소속과_버전_코멘트_권한을_판정한다() throws Exception {
        String folder = create(owner, "artifact-folders", Map.of("name", "folder", "projectId", project));
        String artifact = create(
                owner,
                "artifacts",
                Map.of("title", "doc", "body", "original", "projectId", project, "folderId", id(folder)));
        mvc.perform(get(artifact).cookie(viewer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.projectId").value(project));
        mvc.perform(get(artifact).cookie(outsider)).andExpect(status().isNotFound());
        mvc.perform(patch(artifact)
                        .cookie(viewer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"forbidden\",\"body\":\"x\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(patch(artifact)
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"edited\",\"body\":\"new\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(get(artifact + "/versions/1").cookie(viewer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.body").value("original"));
        mvc.perform(get(artifact + "/versions/2/comments").cookie(outsider)).andExpect(status().isNotFound());
        mvc.perform(patch(folder)
                        .cookie(viewer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"forbidden\"}"))
                .andExpect(status().isForbidden());
        String personalFolder = create(owner, "artifact-folders", Map.of("name", "private"));
        mvc.perform(put(artifact + "/folder")
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("folderId", id(personalFolder)))))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/projects/" + project + "/artifacts/" + id(artifact))
                        .cookie(owner))
                .andExpect(status().isOk());
    }

    @Test
    void 메모의_프로젝트_소속과_공유_범위는_독립적이다() throws Exception {
        String personal = create(owner, "notes", Map.of("body", "personal"));
        String connected = create(owner, "notes", Map.of("body", "private-project", "projectId", project));
        assertThat(read(owner, "/api/v1/notes?scope=personal"))
                .contains(id(personal))
                .doesNotContain(id(connected));
        assertThat(read(owner, "/api/v1/notes?projectId=" + project))
                .contains(id(connected))
                .doesNotContain(id(personal));
        assertThat(read(viewer, "/api/v1/notes?projectId=" + project)).doesNotContain(id(connected));
        mvc.perform(put(connected + "/sharing")
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"shared\":true}"))
                .andExpect(status().isNoContent());
        assertThat(read(viewer, "/api/v1/notes")).contains(id(connected));
        assertThat(read(viewer, "/api/v1/notes?scope=personal")).doesNotContain(id(connected));
        assertThat(read(outsider, "/api/v1/notes")).doesNotContain(id(connected));
        mvc.perform(get("/api/v1/notes")
                        .cookie(owner)
                        .param("scope", "personal")
                        .param("projectId", project))
                .andExpect(status().isBadRequest());
    }

    private Cookie user() throws Exception {
        return AuthTestSupport.가입한다(mvc, mail, UUID.randomUUID() + "@scope.test");
    }

    private String read(Cookie cookie, String url) throws Exception {
        return mvc.perform(get(url).cookie(cookie))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
    }

    private String create(Cookie cookie, String resource, Map<String, ?> body) throws Exception {
        return mvc.perform(post("/api/v1/" + resource)
                        .cookie(cookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location");
    }

    private String id(String path) {
        return path.substring(path.lastIndexOf('/') + 1);
    }
}
