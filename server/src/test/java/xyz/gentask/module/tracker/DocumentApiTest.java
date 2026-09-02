package xyz.gentask.module.tracker;

import static java.util.Objects.requireNonNull;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static xyz.gentask.jooq.Tables.DOCUMENT_REVISIONS;

import jakarta.servlet.http.Cookie;
import java.util.List;
import java.util.UUID;
import org.jooq.DSLContext;
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
import xyz.gentask.jooq.tables.records.DocumentRevisionsRecord;
import xyz.gentask.shared.mail.E2eMailSupport.RecordingMailSender;

@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, FakeMailConfiguration.class})
@Transactional
class DocumentApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RecordingMailSender mail;

    /*
     * 개정 이력을 내는 길이 아직 없으므로(GT-66) 앞의 개정이 그대로 남는지는 표를 직접 보고
     * 확인한다. 시험이 지나는 입구는 그대로 HTTP 다.
     */
    @Autowired
    private DSLContext dslContext;

    private Cookie session;
    private String projectId;

    @BeforeEach
    void 로그인하고_프로젝트를_고른다() throws Exception {
        session = AuthTestSupport.가입한다(mockMvc, mail, "tester-" + UUID.randomUUID() + "@example.com");
        projectId = 프로젝트를_세운다(session, "Gentask", "GT");
    }

    @Test
    @DisplayName("제목을 적어 세우면 문서와 첫 개정이 함께 선다")
    void 세우면_첫_개정이_함께_선다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"정한 것\",\"body\":\"본문\"}");

        상세(documentId)
                .andExpect(jsonPath("$.summary.title").value("정한 것"))
                .andExpect(jsonPath("$.body").value("본문"))
                .andExpect(jsonPath("$.revisionNo").value(1));
        assertThat(개정들(documentId)).hasSize(1);
    }

    @Test
    @DisplayName("본문 없이 세우면 빈 본문으로 담는다")
    void 본문_없이_세우면_빈_본문이다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"제목만\"}");

        상세(documentId)
                .andExpect(jsonPath("$.body").value(""))
                .andExpect(jsonPath("$.revisionNo").value(1));
    }

    @Test
    @DisplayName("제목이 비어 있으면 제목이 필요함을 알리고 아무것도 담지 않는다")
    void 제목이_비어_있으면_담지_않는다() throws Exception {
        mockMvc.perform(post("/api/v1/projects/{projectId}/documents", projectId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"   \",\"body\":\"본문\"}"))
                .andExpect(status().isBadRequest());

        목록().andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("같은 제목의 문서가 이미 있어도 막지 않고 그대로 담는다")
    void 같은_제목을_막지_않는다() throws Exception {
        문서를_세운다("{\"title\":\"겹치는 제목\"}");
        문서를_세운다("{\"title\":\"겹치는 제목\"}");

        목록().andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    @DisplayName("목록을 열면 지금 프로젝트의 문서만 온다")
    void 목록은_지금_프로젝트의_것만_낸다() throws Exception {
        문서를_세운다("{\"title\":\"이 프로젝트의 것\"}");

        String other = 프로젝트를_세운다(session, "Other", "OT");

        목록().andExpect(jsonPath("$", hasSize(1)));
        mockMvc.perform(get("/api/v1/projects/{projectId}/documents", other).cookie(session))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("사용자의 프로젝트가 아니면 세울 수 없고 그 자리가 없는 것으로 낸다")
    void 남의_프로젝트에는_세우지_못한다() throws Exception {
        Cookie other = AuthTestSupport.가입한다(mockMvc, mail, "other-" + UUID.randomUUID() + "@example.com");

        mockMvc.perform(post("/api/v1/projects/{projectId}/documents", projectId)
                        .cookie(other)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"남의 자리\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PROJECT_NOT_FOUND"));
    }

    @Test
    @DisplayName("문서를 열면 지금 참인 개정의 본문을 낸다")
    void 상세는_지금_참인_개정을_낸다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"고칠 것\",\"body\":\"처음 본문\"}");

        고친다(documentId, "{\"title\":\"고칠 것\",\"body\":\"고친 본문\",\"comment\":null}");

        상세(documentId)
                .andExpect(jsonPath("$.body").value("고친 본문"))
                .andExpect(jsonPath("$.revisionNo").value(2));
    }

    /*
     * 본문에 사람이 적지 않은 것이 담길 수 있다. 서버는 그것을 손대지 않고 원문 그대로 내며, 글자를
     * 넘어서지 않게 그리는 것은 그리는 자리가 한다(DOC-002).
     */
    @Test
    @DisplayName("본문에 실행될 수 있는 것이 적혀 있어도 원문 그대로 낸다")
    void 본문을_원문_그대로_낸다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"원문\",\"body\":\"<script>alert(1)</script>\"}");

        상세(documentId).andExpect(jsonPath("$.body").value("<script>alert(1)</script>"));
    }

    @Test
    @DisplayName("사용자의 프로젝트에 속하지 않으면 없는 것으로 낸다")
    void 남의_문서는_열지_못한다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"내 것\"}");

        Cookie other = AuthTestSupport.가입한다(mockMvc, mail, "other-" + UUID.randomUUID() + "@example.com");

        mockMvc.perform(get("/api/v1/projects/{projectId}/documents/{documentId}", projectId, documentId)
                        .cookie(other))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PROJECT_NOT_FOUND"));
    }

    @Test
    @DisplayName("다른 프로젝트의 자리에서 열면 없는 것으로 낸다")
    void 다른_프로젝트에서는_없는_것으로_낸다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"이 프로젝트의 것\"}");

        String other = 프로젝트를_세운다(session, "Other", "OT");

        mockMvc.perform(get("/api/v1/projects/{projectId}/documents/{documentId}", other, documentId)
                        .cookie(session))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("DOCUMENT_NOT_FOUND"));
    }

    @Test
    @DisplayName("고쳐 담으면 새 개정을 남기고 문서가 그것을 가리킨다")
    void 고치면_새_개정을_가리킨다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"처음 제목\",\"body\":\"처음 본문\"}");

        고친다(documentId, "{\"title\":\"고친 제목\",\"body\":\"고친 본문\",\"comment\":\"왜 고쳤는지\"}");

        상세(documentId)
                .andExpect(jsonPath("$.summary.title").value("고친 제목"))
                .andExpect(jsonPath("$.body").value("고친 본문"))
                .andExpect(jsonPath("$.revisionNo").value(2));
    }

    @Test
    @DisplayName("제목만 고쳐도 개정이 하나 늘어난다")
    void 제목만_고쳐도_개정이_된다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"처음 제목\",\"body\":\"그대로 둘 본문\"}");

        고친다(documentId, "{\"title\":\"고친 제목\",\"body\":\"그대로 둘 본문\",\"comment\":null}");

        상세(documentId).andExpect(jsonPath("$.revisionNo").value(2));
    }

    @Test
    @DisplayName("개정을 남겨도 앞의 개정은 고쳐지지도 지워지지도 않는다")
    void 앞의_개정을_그대로_둔다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"처음 제목\",\"body\":\"처음 본문\"}");

        고친다(documentId, "{\"title\":\"고친 제목\",\"body\":\"고친 본문\",\"comment\":null}");

        List<DocumentRevisionsRecord> revisions = 개정들(documentId);
        assertThat(revisions).hasSize(2);
        assertThat(revisions.get(0).getRevisionNo()).isEqualTo(1);
        assertThat(revisions.get(0).getTitle()).isEqualTo("처음 제목");
        assertThat(revisions.get(0).getBody()).isEqualTo("처음 본문");
        assertThat(revisions.get(1).getRevisionNo()).isEqualTo(2);
    }

    @Test
    @DisplayName("앞의 개정과 같은 것을 담으면 개정을 만들지 않고 성공으로 답한다")
    void 달라지지_않은_저장은_개정을_만들지_않는다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"그대로\",\"body\":\"그대로인 본문\"}");

        고친다(documentId, "{\"title\":\"그대로\",\"body\":\"그대로인 본문\",\"comment\":null}");

        상세(documentId).andExpect(jsonPath("$.revisionNo").value(1));
        assertThat(개정들(documentId)).hasSize(1);
    }

    @Test
    @DisplayName("제목이 비어 있으면 알리고 개정을 남기지 않는다")
    void 제목이_비면_개정을_남기지_않는다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"그대로 둘 것\",\"body\":\"본문\"}");

        mockMvc.perform(patch("/api/v1/projects/{projectId}/documents/{documentId}", projectId, documentId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"   \",\"body\":\"고친 본문\",\"comment\":null}"))
                .andExpect(status().isBadRequest());

        상세(documentId)
                .andExpect(jsonPath("$.summary.title").value("그대로 둘 것"))
                .andExpect(jsonPath("$.revisionNo").value(1));
        assertThat(개정들(documentId)).hasSize(1);
    }

    @Test
    @DisplayName("개정 사유를 적지 않아도 담는다")
    void 사유_없이_담는다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"사유 없이\",\"body\":\"처음\"}");

        고친다(documentId, "{\"title\":\"사유 없이\",\"body\":\"고친 것\"}");

        상세(documentId).andExpect(jsonPath("$.revisionNo").value(2));
        assertThat(개정들(documentId).get(1).getComment()).isNull();
    }

    @Test
    @DisplayName("사용자의 프로젝트에 속하지 않으면 고치지 못한다")
    void 남의_문서는_고치지_못한다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"내 것\",\"body\":\"내 본문\"}");

        Cookie other = AuthTestSupport.가입한다(mockMvc, mail, "other-" + UUID.randomUUID() + "@example.com");

        mockMvc.perform(patch("/api/v1/projects/{projectId}/documents/{documentId}", projectId, documentId)
                        .cookie(other)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"바꾸기\",\"body\":\"바꾼 본문\",\"comment\":null}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PROJECT_NOT_FOUND"));

        상세(documentId).andExpect(jsonPath("$.body").value("내 본문"));
    }

    @Test
    @DisplayName("주소의 식별자가 문서의 것이 아니면 없는 것으로 낸다")
    void 모양이_아닌_식별자는_없는_것으로_낸다() throws Exception {
        mockMvc.perform(get("/api/v1/projects/{projectId}/documents/{documentId}", projectId, "문서-아님")
                        .cookie(session))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("DOCUMENT_NOT_FOUND"));
    }

    @Test
    @DisplayName("로그인 없이 문서에 닿을 수 없다")
    void 로그인_없이_문서에_닿을_수_없다() throws Exception {
        mockMvc.perform(get("/api/v1/projects/{projectId}/documents", projectId))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    // --- 준비 --------------------------------------------------------------------------------------------------------
    private ResultActions 목록() throws Exception {
        return mockMvc.perform(
                        get("/api/v1/projects/{projectId}/documents", projectId).cookie(session))
                .andExpect(status().isOk());
    }

    private ResultActions 상세(String documentId) throws Exception {
        return mockMvc.perform(get("/api/v1/projects/{projectId}/documents/{documentId}", projectId, documentId)
                        .cookie(session))
                .andExpect(status().isOk());
    }

    private void 고친다(String documentId, String body) throws Exception {
        mockMvc.perform(patch("/api/v1/projects/{projectId}/documents/{documentId}", projectId, documentId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNoContent());
    }

    private String 문서를_세운다(String body) throws Exception {
        String location = requireNonNull(mockMvc.perform(post("/api/v1/projects/{projectId}/documents", projectId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location"));
        return location.substring(location.lastIndexOf('/') + 1);
    }

    private List<DocumentRevisionsRecord> 개정들(String documentId) {
        return dslContext
                .selectFrom(DOCUMENT_REVISIONS)
                .where(DOCUMENT_REVISIONS.DOCUMENT_ID.eq(UUID.fromString(documentId)))
                .orderBy(DOCUMENT_REVISIONS.REVISION_NO.asc())
                .fetch();
    }

    private String 프로젝트를_세운다(Cookie cookie, String name, String key) throws Exception {
        String location = requireNonNull(mockMvc.perform(post("/api/v1/projects")
                        .cookie(cookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"%s\",\"key\":\"%s\"}".formatted(name, key)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location"));
        return location.substring(location.lastIndexOf('/') + 1);
    }
}
