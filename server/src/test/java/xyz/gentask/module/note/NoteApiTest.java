package xyz.gentask.module.note;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
import xyz.gentask.AuthTestSupport;
import xyz.gentask.FakeMailConfiguration;
import xyz.gentask.FakeStorageConfiguration;
import xyz.gentask.TestcontainersConfiguration;
import xyz.gentask.shared.mail.E2eMailSupport.RecordingMailSender;

@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, FakeMailConfiguration.class, FakeStorageConfiguration.class})
@Transactional
class NoteApiTest {
    @Autowired
    MockMvc mvc;

    @Autowired
    RecordingMailSender mail;

    @Autowired
    JsonMapper json;

    @Autowired
    DSLContext dsl;

    @Autowired
    FakeStorageConfiguration.FakeObjectStorage storage;

    Cookie owner;
    Cookie member;
    Cookie outsider;
    String project;
    UUID memberId;

    @BeforeEach
    void prepare() throws Exception {
        owner = AuthTestSupport.가입한다(mvc, mail, UUID.randomUUID() + "@example.test");
        member = AuthTestSupport.가입한다(mvc, mail, UUID.randomUUID() + "@example.test");
        outsider = AuthTestSupport.가입한다(mvc, mail, UUID.randomUUID() + "@example.test");
        project = json.readTree(mvc.perform(get("/api/v1/projects").cookie(owner))
                        .andReturn()
                        .getResponse()
                        .getContentAsString())
                .get(0)
                .get("id")
                .asText();
        memberId = UUID.fromString(json.readTree(mvc.perform(get("/api/v1/me").cookie(member))
                        .andReturn()
                        .getResponse()
                        .getContentAsString())
                .get("id")
                .asText());
        dsl.insertInto(PROJECT_MEMBERS)
                .set(PROJECT_MEMBERS.PROJECT_ID, project)
                .set(PROJECT_MEMBERS.USER_ID, memberId)
                .set(PROJECT_MEMBERS.ROLE, "editor")
                .set(PROJECT_MEMBERS.JOINED_AT, Instant.now())
                .execute();
    }

    private String create(Cookie actor, Map<String, ?> body) throws Exception {
        String location = mvc.perform(post("/api/v1/notes")
                        .cookie(actor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location");
        assertThat(location).matches("/api/v1/notes/[A-Za-z0-9_-]{12}");
        return location;
    }

    @Test
    void 프로젝트_연결은_공개하지_않고_명시적_공유와_회수는_조회에_반영한다() throws Exception {
        String note = create(owner, Map.of("body", "# 아직 생각 중", "projectId", project));
        mvc.perform(get(note).cookie(member)).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/notes").cookie(member))
                .andExpect(jsonPath("$.items.length()").value(0));
        mvc.perform(put(note + "/sharing")
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"shared\":true}"))
                .andExpect(status().isNoContent());
        mvc.perform(get(note).cookie(member))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.body").value("# 아직 생각 중"));
        mvc.perform(get("/api/v1/notes").cookie(member))
                .andExpect(jsonPath("$.items.length()").value(1));
        mvc.perform(get("/api/v1/notes").cookie(outsider))
                .andExpect(jsonPath("$.items.length()").value(0));
        mvc.perform(get(note).cookie(outsider)).andExpect(status().isNotFound());
        mvc.perform(patch(note)
                        .cookie(member)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"body\":\"다른 내용\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(delete(note).cookie(member)).andExpect(status().isForbidden());
        mvc.perform(put(note + "/sharing")
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"shared\":false}"))
                .andExpect(status().isNoContent());
        mvc.perform(get(note).cookie(member)).andExpect(status().isNotFound());
    }

    @Test
    void 연결을_해제하면_공유가_해제되고_멤버_탈퇴도_접근을_차단한다() throws Exception {
        String note = create(owner, Map.of("body", "공유 자료", "projectId", project));
        mvc.perform(put(note + "/sharing")
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"shared\":true}"))
                .andExpect(status().isNoContent());
        dsl.deleteFrom(PROJECT_MEMBERS)
                .where(PROJECT_MEMBERS.PROJECT_ID.eq(project))
                .and(PROJECT_MEMBERS.USER_ID.eq(memberId))
                .execute();
        mvc.perform(get(note).cookie(member)).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/notes").cookie(member))
                .andExpect(jsonPath("$.items.length()").value(0));
        mvc.perform(put(note + "/project")
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNoContent());
        mvc.perform(get(note).cookie(owner))
                .andExpect(jsonPath("$.shared").value(false))
                .andExpect(jsonPath("$.projectId").doesNotExist());
        mvc.perform(put(note + "/sharing")
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"shared\":true}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void 뷰어는_비공개_연결은_가능하지만_공유할_수_없다() throws Exception {
        dsl.update(PROJECT_MEMBERS)
                .set(PROJECT_MEMBERS.ROLE, "viewer")
                .where(PROJECT_MEMBERS.PROJECT_ID.eq(project))
                .and(PROJECT_MEMBERS.USER_ID.eq(memberId))
                .execute();
        String note = create(member, Map.of("body", "개인 생각", "projectId", project));
        mvc.perform(get(note).cookie(owner)).andExpect(status().isNotFound());
        mvc.perform(put(note + "/sharing")
                        .cookie(member)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"shared\":true}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    void 파일만_등록할_수_있고_미업로드_파일은_메모와_함께_롤백한다() throws Exception {
        mvc.perform(post("/api/v1/notes")
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"body\":\"   \"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/notes")
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"body\":\"실패\",\"objectKeys\":[\"없는키\"]}"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/notes").cookie(owner))
                .andExpect(jsonPath("$.items.length()").value(0));
        String key = json.readTree(mvc.perform(
                                post("/api/v1/attachments/presign")
                                        .cookie(owner)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                "{\"slot\":\"NOTE_FILES\",\"fileName\":\"이미지.png\",\"contentType\":\"image/png\",\"size\":50}"))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString())
                .get("objectKey")
                .asText();
        storage.put(key, 50);
        String note = create(owner, Map.of("body", "", "objectKeys", java.util.List.of(key)));
        var detail = json.readTree(mvc.perform(get(note).cookie(owner))
                .andExpect(jsonPath("$.files[0].fileName").value("이미지.png"))
                .andReturn()
                .getResponse()
                .getContentAsString());
        mvc.perform(get(note).cookie(member)).andExpect(status().isNotFound());
        mvc.perform(delete(note + "/files/"
                                + detail.get("files").get(0).get("id").asText())
                        .cookie(owner))
                .andExpect(status().isBadRequest());
        mvc.perform(delete(note).cookie(owner)).andExpect(status().isNoContent());
        mvc.perform(get(note).cookie(owner)).andExpect(status().isNotFound());
    }

    @Test
    void 정렬을_적용한_순서로_페이지를_조회한다() throws Exception {
        String first = create(owner, Map.of("body", "first"));
        String second = create(owner, Map.of("body", "second"));
        var table = xyz.gentask.jooq.Tables.NOTES;
        dsl.update(table)
                .set(table.CREATED_AT, Instant.parse("2026-01-01T00:00:00Z"))
                .set(table.UPDATED_AT, Instant.parse("2026-03-01T00:00:00Z"))
                .where(table.ID.eq(first.substring(first.lastIndexOf('/') + 1)))
                .execute();
        dsl.update(table)
                .set(table.CREATED_AT, Instant.parse("2026-02-01T00:00:00Z"))
                .set(table.UPDATED_AT, Instant.parse("2026-02-01T00:00:00Z"))
                .where(table.ID.eq(second.substring(second.lastIndexOf('/') + 1)))
                .execute();
        mvc.perform(get("/api/v1/notes").cookie(owner))
                .andExpect(jsonPath("$.items[0].body").value("second"));
        mvc.perform(get("/api/v1/notes?sort=created-asc").cookie(owner))
                .andExpect(jsonPath("$.items[0].body").value("first"));
        mvc.perform(get("/api/v1/notes?sort=updated-desc&offset=1").cookie(owner))
                .andExpect(jsonPath("$.items[0].body").value("second"));
        mvc.perform(get("/api/v1/notes?sort=unknown").cookie(owner)).andExpect(status().isBadRequest());
    }

    @Test
    void 보관은_기본목록에서_제외하고_태그조회와_복원을_지원한다() throws Exception {
        String note = create(owner, Map.of("body", "정리할 메모"));
        mvc.perform(put(note + "/tags")
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tags\":[\" 질문 \",\"질문\",\"아이디어\"]}"))
                .andExpect(status().isNoContent());
        mvc.perform(get(note).cookie(owner))
                .andExpect(jsonPath("$.tags.length()").value(2))
                .andExpect(jsonPath("$.archived").value(false));
        mvc.perform(get("/api/v1/notes").cookie(owner).param("tag", "질문"))
                .andExpect(jsonPath("$.items.length()").value(1));
        mvc.perform(get("/api/v1/notes").cookie(owner).param("tag", "없는태그"))
                .andExpect(jsonPath("$.items.length()").value(0));
        mvc.perform(put(note + "/archive")
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"archived\":true}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/notes").cookie(owner))
                .andExpect(jsonPath("$.items.length()").value(0));
        mvc.perform(get("/api/v1/notes")
                        .cookie(owner)
                        .param("archive", "archived")
                        .param("tag", "질문"))
                .andExpect(jsonPath("$.items.length()").value(1));
        mvc.perform(get(note).cookie(owner)).andExpect(status().isOk());
        mvc.perform(put(note + "/archive")
                        .cookie(outsider)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"archived\":false}"))
                .andExpect(status().isForbidden());
        mvc.perform(put(note + "/tags")
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tags\":[\"   \"]}"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/notes").cookie(owner).param("archive", "invalid"))
                .andExpect(status().isBadRequest());
        mvc.perform(put(note + "/archive")
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"archived\":false}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/notes").cookie(owner))
                .andExpect(jsonPath("$.items.length()").value(1));
    }

    @Test
    void 작업연결은_공개범위를_유지하고_보관메모를_조회하며_공유회수를_반영한다() throws Exception {
        String note = create(owner, Map.of("body", "프로젝트 근거", "projectId", project));
        String id = note.substring(note.lastIndexOf('/') + 1);
        String task = mvc.perform(post("/api/v1/tasks")
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("title", "근거 확인", "projectId", project))))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location");
        mvc.perform(put(task + "/notes/" + id).cookie(owner)).andExpect(status().isNotFound());
        mvc.perform(get(note).cookie(owner)).andExpect(jsonPath("$.shared").value(false));
        mvc.perform(put(note + "/sharing")
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"shared\":true}"))
                .andExpect(status().isNoContent());
        mvc.perform(put(task + "/notes/" + id).cookie(owner)).andExpect(status().isNoContent());
        mvc.perform(put(task + "/notes/" + id).cookie(owner)).andExpect(status().isNoContent());
        mvc.perform(put(note + "/archive")
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"archived\":true}"))
                .andExpect(status().isNoContent());
        mvc.perform(get(task + "/notes").cookie(member))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].archived").value(true));
        mvc.perform(get(task + "/notes").cookie(outsider)).andExpect(status().isNotFound());
        mvc.perform(put(note + "/sharing")
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"shared\":false}"))
                .andExpect(status().isNoContent());
        mvc.perform(get(task + "/notes").cookie(member))
                .andExpect(jsonPath("$.length()").value(0));
        mvc.perform(delete(task + "/notes/" + id).cookie(owner)).andExpect(status().isNoContent());
        mvc.perform(get(note).cookie(owner)).andExpect(status().isOk());
    }

    @Test
    void 개인작업에는_다른사람의_메모를_연결할수없다() throws Exception {
        String note = create(outsider, Map.of("body", "비공개"));
        String task = mvc.perform(post("/api/v1/tasks")
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"개인 작업\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location");
        mvc.perform(put(task + "/notes/" + note.substring(note.lastIndexOf('/') + 1))
                        .cookie(owner))
                .andExpect(status().isNotFound());
        String mine = create(owner, Map.of("body", "내 메모"));
        String id = mine.substring(mine.lastIndexOf('/') + 1);
        mvc.perform(put(task + "/notes/" + id).cookie(owner)).andExpect(status().isNoContent());
        mvc.perform(delete(mine).cookie(owner)).andExpect(status().isNoContent());
        mvc.perform(get(task + "/notes").cookie(owner))
                .andExpect(jsonPath("$.length()").value(0));
    }
}
