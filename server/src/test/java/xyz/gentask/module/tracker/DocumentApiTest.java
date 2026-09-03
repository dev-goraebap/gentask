package xyz.gentask.module.tracker;

import static java.util.Objects.requireNonNull;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
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
     * API 응답에 노출되지 않는 내부 개정 레코드 상태 검증을 위해 데이터베이스 테이블을 직접 조회한다.
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
    @DisplayName("문서 생성 시 문서와 1차 개정 레코드를 함께 등록한다")
    void 세우면_첫_개정이_함께_선다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"정한 것\",\"body\":\"본문\"}");

        상세(documentId)
                .andExpect(jsonPath("$.summary.title").value("정한 것"))
                .andExpect(jsonPath("$.body").value("본문"))
                .andExpect(jsonPath("$.revisionNo").value(1));
        assertThat(개정들(documentId)).hasSize(1);
    }

    @Test
    @DisplayName("본문 없이 생성하면 빈 문자열 본문으로 등록한다")
    void 본문_없이_세우면_빈_본문이다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"제목만\"}");

        상세(documentId)
                .andExpect(jsonPath("$.body").value(""))
                .andExpect(jsonPath("$.revisionNo").value(1));
    }

    @Test
    @DisplayName("제목이 공백이면 400 오류를 반환하고 문서를 생성하지 않는다")
    void 제목이_비어_있으면_담지_않는다() throws Exception {
        mockMvc.perform(post("/api/v1/projects/{projectId}/documents", projectId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"   \",\"body\":\"본문\"}"))
                .andExpect(status().isBadRequest());

        목록().andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("동일한 제목의 문서가 존재해도 중복 생성을 허용한다")
    void 같은_제목을_막지_않는다() throws Exception {
        문서를_세운다("{\"title\":\"겹치는 제목\"}");
        문서를_세운다("{\"title\":\"겹치는 제목\"}");

        목록().andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    @DisplayName("폴더 미지정 시 최상위 루트 경로에 문서를 생성한다")
    void 폴더_없이_세우면_뿌리에_선다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"뿌리의 것\"}");

        상세(documentId).andExpect(jsonPath("$.summary.folderId").value(nullValue()));
        목록().andExpect(jsonPath("$[0].folderId").value(nullValue()));
    }

    @Test
    @DisplayName("폴더를 지정하여 생성하면 해당 폴더 하위에 문서를 등록한다")
    void 폴더를_적어_세운다() throws Exception {
        String folderId = 폴더를_세운다("담을 자리");

        String documentId = 문서를_세운다("{\"title\":\"담긴 것\",\"folderId\":\"%s\"}".formatted(folderId));

        상세(documentId).andExpect(jsonPath("$.summary.folderId").value(folderId));
        목록().andExpect(jsonPath("$[0].folderId").value(folderId));
    }

    @Test
    @DisplayName("존재하지 않는 폴더를 지정하면 404를 반환한다")
    void 없는_폴더에는_세우지_못한다() throws Exception {
        mockMvc.perform(post("/api/v1/projects/{projectId}/documents", projectId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"어디에\",\"folderId\":\"%s\"}".formatted(UUID.randomUUID())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("FOLDER_NOT_FOUND"));

        목록().andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("문서의 폴더를 변경하면 소속 폴더 정보가 갱신된다")
    void 문서를_폴더로_옮긴다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"옮길 것\"}");
        String folderId = 폴더를_세운다("받을 자리");

        옮긴다(documentId, "{\"folderId\":\"%s\"}".formatted(folderId));

        상세(documentId).andExpect(jsonPath("$.summary.folderId").value(folderId));
    }

    /*
     * 개정이 갖는 것은 문서가 말하는 바이고 어느 폴더에 있는지는 그것과 무관하다(DOC-006).
     */
    @Test
    @DisplayName("문서 이동 시 개정 이력을 추가하지 않고 내용도 유지한다")
    void 옮기는_것은_개정이_아니다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"옮길 것\",\"body\":\"본문\"}");
        String folderId = 폴더를_세운다("받을 자리");

        옮긴다(documentId, "{\"folderId\":\"%s\"}".formatted(folderId));

        상세(documentId)
                .andExpect(jsonPath("$.summary.title").value("옮길 것"))
                .andExpect(jsonPath("$.body").value("본문"))
                .andExpect(jsonPath("$.revisionNo").value(1));
        assertThat(개정들(documentId)).hasSize(1);
    }

    @Test
    @DisplayName("문서 폴더를 null로 지정하면 최상위 루트로 이동한다")
    void 문서를_최상위로_옮긴다() throws Exception {
        String folderId = 폴더를_세운다("담을 자리");
        String documentId = 문서를_세운다("{\"title\":\"옮길 것\",\"folderId\":\"%s\"}".formatted(folderId));

        옮긴다(documentId, "{\"folderId\":null}");

        상세(documentId).andExpect(jsonPath("$.summary.folderId").value(nullValue()));
    }

    @Test
    @DisplayName("현재와 동일한 폴더로 이동 요청 시 데이터를 변경하지 않는다")
    void 있던_자리로_옮기면_그대로다() throws Exception {
        String folderId = 폴더를_세운다("담을 자리");
        String documentId = 문서를_세운다("{\"title\":\"그대로\",\"folderId\":\"%s\"}".formatted(folderId));

        옮긴다(documentId, "{\"folderId\":\"%s\"}".formatted(folderId));

        상세(documentId)
                .andExpect(jsonPath("$.summary.folderId").value(folderId))
                .andExpect(jsonPath("$.revisionNo").value(1));
        assertThat(개정들(documentId)).hasSize(1);
    }

    @Test
    @DisplayName("존재하지 않는 폴더로 이동 요청 시 404를 반환하고 기존 폴더를 유지한다")
    void 없는_자리로는_옮기지_못한다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"그대로\"}");

        mockMvc.perform(put("/api/v1/projects/{projectId}/documents/{documentId}/folder", projectId, documentId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"folderId\":\"%s\"}".formatted(UUID.randomUUID())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("FOLDER_NOT_FOUND"));

        상세(documentId).andExpect(jsonPath("$.summary.folderId").value(nullValue()));
    }

    @Test
    @DisplayName("타 프로젝트 소속 폴더로는 문서를 이동할 수 없다")
    void 남의_폴더로는_옮기지_못한다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"내 것\"}");

        String other = 프로젝트를_세운다(session, "Other", "OT");
        String folderId = 폴더를_세운다(other, "남의 자리");

        mockMvc.perform(put("/api/v1/projects/{projectId}/documents/{documentId}/folder", projectId, documentId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"folderId\":\"%s\"}".formatted(folderId)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("FOLDER_NOT_FOUND"));
    }

    @Test
    @DisplayName("타 사용자의 프로젝트 문서 이동 요청 시 404를 반환한다")
    void 남의_문서는_옮기지_못한다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"내 것\"}");

        Cookie other = AuthTestSupport.가입한다(mockMvc, mail, "other-" + UUID.randomUUID() + "@example.com");

        mockMvc.perform(put("/api/v1/projects/{projectId}/documents/{documentId}/folder", projectId, documentId)
                        .cookie(other)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"folderId\":null}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PROJECT_NOT_FOUND"));
    }

    @Test
    @DisplayName("문서 목록 조회 시 현재 프로젝트의 문서만 반환한다")
    void 목록은_지금_프로젝트의_것만_낸다() throws Exception {
        문서를_세운다("{\"title\":\"이 프로젝트의 것\"}");

        String other = 프로젝트를_세운다(session, "Other", "OT");

        목록().andExpect(jsonPath("$", hasSize(1)));
        mockMvc.perform(get("/api/v1/projects/{projectId}/documents", other).cookie(session))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("타 사용자의 프로젝트에 문서 생성 요청 시 404를 반환한다")
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
    @DisplayName("문서 상세 조회 시 현재 유효한 최신 개정의 본문을 반환한다")
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
    @DisplayName("스크립트 태그가 포함된 본문도 원문 마크다운 그대로 반환한다")
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
    @DisplayName("타 프로젝트 경로에서 문서 조회 시 404를 반환한다")
    void 다른_프로젝트에서는_없는_것으로_낸다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"이 프로젝트의 것\"}");

        String other = 프로젝트를_세운다(session, "Other", "OT");

        mockMvc.perform(get("/api/v1/projects/{projectId}/documents/{documentId}", other, documentId)
                        .cookie(session))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("DOCUMENT_NOT_FOUND"));
    }

    @Test
    @DisplayName("문서 수정 시 신규 개정을 등록하고 최신 개정 번호를 갱신한다")
    void 고치면_새_개정을_가리킨다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"처음 제목\",\"body\":\"처음 본문\"}");

        고친다(documentId, "{\"title\":\"고친 제목\",\"body\":\"고친 본문\",\"comment\":\"왜 고쳤는지\"}");

        상세(documentId)
                .andExpect(jsonPath("$.summary.title").value("고친 제목"))
                .andExpect(jsonPath("$.body").value("고친 본문"))
                .andExpect(jsonPath("$.revisionNo").value(2));
    }

    @Test
    @DisplayName("제목만 수정해도 새로운 개정이 등록된다")
    void 제목만_고쳐도_개정이_된다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"처음 제목\",\"body\":\"그대로 둘 본문\"}");

        고친다(documentId, "{\"title\":\"고친 제목\",\"body\":\"그대로 둘 본문\",\"comment\":null}");

        상세(documentId).andExpect(jsonPath("$.revisionNo").value(2));
    }

    @Test
    @DisplayName("새 개정이 등록되어도 기존 과거 개정 데이터는 불변으로 유지된다")
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
    @DisplayName("기존 내용과 동일한 수정 요청 시 개정을 추가하지 않고 성공 응답한다")
    void 달라지지_않은_저장은_개정을_만들지_않는다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"그대로\",\"body\":\"그대로인 본문\"}");

        고친다(documentId, "{\"title\":\"그대로\",\"body\":\"그대로인 본문\",\"comment\":null}");

        상세(documentId).andExpect(jsonPath("$.revisionNo").value(1));
        assertThat(개정들(documentId)).hasSize(1);
    }

    @Test
    @DisplayName("수정 요청 제목이 공백이면 400 오류를 반환하고 새 개정을 생성하지 않는다")
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
    @DisplayName("개정 사유를 생략해도 정상적으로 수정을 반영한다")
    void 사유_없이_담는다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"사유 없이\",\"body\":\"처음\"}");

        고친다(documentId, "{\"title\":\"사유 없이\",\"body\":\"고친 것\"}");

        상세(documentId).andExpect(jsonPath("$.revisionNo").value(2));
        assertThat(개정들(documentId).get(1).getComment()).isNull();
    }

    @Test
    @DisplayName("타 사용자의 프로젝트 문서 수정 요청 시 404를 반환한다")
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
    @DisplayName("유효하지 않은 형식의 문서 식별자로 조회 시 404를 반환한다")
    void 모양이_아닌_식별자는_없는_것으로_낸다() throws Exception {
        mockMvc.perform(get("/api/v1/projects/{projectId}/documents/{documentId}", projectId, "문서-아님")
                        .cookie(session))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("DOCUMENT_NOT_FOUND"));
    }

    @Test
    @DisplayName("인증되지 않은 사용자의 문서 접근을 거부한다")
    void 로그인_없이_문서에_닿을_수_없다() throws Exception {
        mockMvc.perform(get("/api/v1/projects/{projectId}/documents", projectId))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    @DisplayName("문서 개정 이력 조회 시 최신 개정 순으로 버전 번호, 일시, 작성자, 사유를 반환한다")
    void 이력은_최근_것부터_온다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"처음 제목\",\"body\":\"처음 본문\"}");
        고친다(documentId, "{\"title\":\"고친 제목\",\"body\":\"고친 본문\",\"comment\":\"왜 고쳤는지\"}");

        이력(documentId)
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(jsonPath("$.items[0].revisionNo").value(2))
                .andExpect(jsonPath("$.items[0].comment").value("왜 고쳤는지"))
                .andExpect(jsonPath("$.items[0].authorName").isNotEmpty())
                .andExpect(jsonPath("$.items[0].createdAt").isNotEmpty())
                .andExpect(jsonPath("$.items[1].revisionNo").value(1))
                .andExpect(jsonPath("$.items[1].comment").isEmpty());
    }

    @Test
    @DisplayName("개정 이력 목록 항목에는 본문 데이터를 포함하지 않는다")
    void 이력은_본문을_싣지_않는다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"제목\",\"body\":\"긴 본문\"}");

        이력(documentId).andExpect(jsonPath("$.items[0].body").doesNotExist());
    }

    @Test
    @DisplayName("수정 이력이 없는 문서는 초기 개정 1건만 반환한다")
    void 고치지_않았으면_개정이_하나다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"그대로\",\"body\":\"본문\"}");

        이력(documentId)
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].revisionNo").value(1));
    }

    @Test
    @DisplayName("개정 목록이 페이지 크기를 초과하면 페이징 처리하여 반환한다")
    void 이력을_쪽으로_나눠_낸다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"제목\",\"body\":\"본문 1\"}");
        고친다(documentId, "{\"title\":\"제목\",\"body\":\"본문 2\"}");
        고친다(documentId, "{\"title\":\"제목\",\"body\":\"본문 3\"}");

        이력(documentId, "?page=0&size=2")
                .andExpect(jsonPath("$.total").value(3))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(jsonPath("$.items[0].revisionNo").value(3))
                .andExpect(jsonPath("$.items[1].revisionNo").value(2));

        이력(documentId, "?page=1&size=2")
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].revisionNo").value(1));
    }

    @Test
    @DisplayName("특정 개정 번호 조회 시 해당 시점의 제목과 본문을 반환한다")
    void 개정_하나는_그때의_본문을_낸다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"처음 제목\",\"body\":\"처음 본문\"}");
        고친다(documentId, "{\"title\":\"고친 제목\",\"body\":\"고친 본문\",\"comment\":null}");

        개정(documentId, 1)
                .andExpect(jsonPath("$.title").value("처음 제목"))
                .andExpect(jsonPath("$.body").value("처음 본문"))
                .andExpect(jsonPath("$.summary.revisionNo").value(1));

        개정(documentId, 2)
                .andExpect(jsonPath("$.title").value("고친 제목"))
                .andExpect(jsonPath("$.body").value("고친 본문"));
    }

    @Test
    @DisplayName("존재하지 않는 개정 번호 조회 시 404를 반환한다")
    void 없는_개정은_없는_것으로_낸다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"제목\",\"body\":\"본문\"}");

        mockMvc.perform(get(
                                "/api/v1/projects/{projectId}/documents/{documentId}/revisions/{revisionNo}",
                                projectId,
                                documentId,
                                "9")
                        .cookie(session))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("REVISION_NOT_FOUND"));
    }

    @Test
    @DisplayName("타 사용자의 프로젝트 문서 이력 조회 시 404를 반환한다")
    void 남의_문서의_이력에는_닿을_수_없다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"내 것\",\"body\":\"내 본문\"}");

        Cookie other = AuthTestSupport.가입한다(mockMvc, mail, "other-" + UUID.randomUUID() + "@example.com");

        mockMvc.perform(get("/api/v1/projects/{projectId}/documents/{documentId}/revisions", projectId, documentId)
                        .cookie(other))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PROJECT_NOT_FOUND"));
    }

    @Test
    @DisplayName("타 프로젝트 경로에서 개정 이력 조회 시 404를 반환한다")
    void 다른_프로젝트에서는_이력이_없다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"이 프로젝트의 것\",\"body\":\"본문\"}");

        String other = 프로젝트를_세운다(session, "Other", "OT");

        mockMvc.perform(get("/api/v1/projects/{projectId}/documents/{documentId}/revisions", other, documentId)
                        .cookie(session))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("DOCUMENT_NOT_FOUND"));
    }

    @Test
    @DisplayName("과거 개정으로 롤백 시 해당 본문을 가진 신규 개정을 등록하고 최신으로 설정한다")
    void 되돌리면_새_개정을_가리킨다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"처음 제목\",\"body\":\"처음 본문\"}");
        고친다(documentId, "{\"title\":\"고친 제목\",\"body\":\"고친 본문\",\"comment\":null}");

        되돌린다(documentId, 1, null);

        상세(documentId)
                .andExpect(jsonPath("$.summary.title").value("처음 제목"))
                .andExpect(jsonPath("$.body").value("처음 본문"))
                .andExpect(jsonPath("$.revisionNo").value(3));
    }

    @Test
    @DisplayName("개정을 되돌려도 중간 개정 이력은 삭제되지 않고 보존된다")
    void 되돌려도_사이의_개정이_남는다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"처음 제목\",\"body\":\"처음 본문\"}");
        고친다(documentId, "{\"title\":\"고친 제목\",\"body\":\"고친 본문\",\"comment\":null}");

        되돌린다(documentId, 1, null);

        List<DocumentRevisionsRecord> revisions = 개정들(documentId);
        assertThat(revisions).hasSize(3);
        assertThat(revisions.get(1).getRevisionNo()).isEqualTo(2);
        assertThat(revisions.get(1).getTitle()).isEqualTo("고친 제목");
        assertThat(revisions.get(1).getBody()).isEqualTo("고친 본문");
    }

    @Test
    @DisplayName("롤백 사유 미입력 시 대상 개정 번호 기반 기본 사유를 자동 생성한다")
    void 되돌린_사유를_스스로_적는다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"처음 제목\",\"body\":\"처음 본문\"}");
        고친다(documentId, "{\"title\":\"고친 제목\",\"body\":\"고친 본문\",\"comment\":null}");

        되돌린다(documentId, 1, null);

        이력(documentId)
                .andExpect(jsonPath("$.items[0].revisionNo").value(3))
                .andExpect(jsonPath("$.items[0].comment").value("1번 개정으로 되돌림"));
    }

    @Test
    @DisplayName("롤백 사유 입력 시 해당 사유를 신규 개정에 저장한다")
    void 되돌린_이유를_적을_수_있다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"처음 제목\",\"body\":\"처음 본문\"}");
        고친다(documentId, "{\"title\":\"고친 제목\",\"body\":\"고친 본문\",\"comment\":null}");

        되돌린다(documentId, 1, "{\"comment\":\"고친 쪽이 틀렸다\"}");

        이력(documentId).andExpect(jsonPath("$.items[0].comment").value("고친 쪽이 틀렸다"));
    }

    @Test
    @DisplayName("롤백 대상 본문이 현재 최신 본문과 동일하면 신규 개정을 생성하지 않는다")
    void 같은_것으로_되돌리면_개정을_만들지_않는다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"그대로\",\"body\":\"그대로인 본문\"}");

        되돌린다(documentId, 1, null);

        상세(documentId).andExpect(jsonPath("$.revisionNo").value(1));
        assertThat(개정들(documentId)).hasSize(1);
    }

    @Test
    @DisplayName("되돌린 문서를 재차 이전 개정으로 롤백할 수 있으며 신규 개정으로 추가된다")
    void 되돌린_것을_다시_되돌린다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"처음 제목\",\"body\":\"처음 본문\"}");
        고친다(documentId, "{\"title\":\"고친 제목\",\"body\":\"고친 본문\",\"comment\":null}");

        되돌린다(documentId, 1, null);
        되돌린다(documentId, 2, null);

        상세(documentId)
                .andExpect(jsonPath("$.body").value("고친 본문"))
                .andExpect(jsonPath("$.revisionNo").value(4));
    }

    @Test
    @DisplayName("존재하지 않는 개정 번호로의 롤백 요청 시 404를 반환한다")
    void 없는_개정으로는_되돌리지_못한다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"제목\",\"body\":\"본문\"}");

        mockMvc.perform(post(
                                "/api/v1/projects/{projectId}/documents/{documentId}/revisions/{revisionNo}/revert",
                                projectId,
                                documentId,
                                "9")
                        .cookie(session))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("REVISION_NOT_FOUND"));

        assertThat(개정들(documentId)).hasSize(1);
    }

    @Test
    @DisplayName("타 사용자의 프로젝트 문서 롤백 요청 시 404를 반환한다")
    void 남의_문서는_되돌리지_못한다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"내 것\",\"body\":\"내 본문\"}");
        고친다(documentId, "{\"title\":\"내 것\",\"body\":\"고친 본문\",\"comment\":null}");

        Cookie other = AuthTestSupport.가입한다(mockMvc, mail, "other-" + UUID.randomUUID() + "@example.com");

        mockMvc.perform(post(
                                "/api/v1/projects/{projectId}/documents/{documentId}/revisions/{revisionNo}/revert",
                                projectId,
                                documentId,
                                "1")
                        .cookie(other))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PROJECT_NOT_FOUND"));

        상세(documentId).andExpect(jsonPath("$.body").value("고친 본문"));
    }

    @Test
    @DisplayName("인증되지 않은 사용자의 개정 이력 접근을 거부한다")
    void 로그인_없이_이력에_닿을_수_없다() throws Exception {
        String documentId = 문서를_세운다("{\"title\":\"제목\",\"body\":\"본문\"}");

        mockMvc.perform(get("/api/v1/projects/{projectId}/documents/{documentId}/revisions", projectId, documentId))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    // --- 준비 --------------------------------------------------------------------------------------------------------
    private ResultActions 이력(String documentId) throws Exception {
        return 이력(documentId, "");
    }

    private ResultActions 이력(String documentId, String query) throws Exception {
        return mockMvc.perform(get(
                                "/api/v1/projects/{projectId}/documents/{documentId}/revisions" + query,
                                projectId,
                                documentId)
                        .cookie(session))
                .andExpect(status().isOk());
    }

    private ResultActions 개정(String documentId, int revisionNo) throws Exception {
        return mockMvc.perform(get(
                                "/api/v1/projects/{projectId}/documents/{documentId}/revisions/{revisionNo}",
                                projectId,
                                documentId,
                                revisionNo)
                        .cookie(session))
                .andExpect(status().isOk());
    }

    private void 되돌린다(String documentId, int revisionNo, String body) throws Exception {
        MockHttpServletRequestBuilder request = post(
                        "/api/v1/projects/{projectId}/documents/{documentId}/revisions/{revisionNo}/revert",
                        projectId,
                        documentId,
                        revisionNo)
                .cookie(session);
        if (body != null) {
            request.contentType(MediaType.APPLICATION_JSON).content(body);
        }
        mockMvc.perform(request).andExpect(status().isNoContent());
    }

    private void 옮긴다(String documentId, String body) throws Exception {
        mockMvc.perform(put("/api/v1/projects/{projectId}/documents/{documentId}/folder", projectId, documentId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNoContent());
    }

    private String 폴더를_세운다(String name) throws Exception {
        return 폴더를_세운다(projectId, name);
    }

    private String 폴더를_세운다(String inProjectId, String name) throws Exception {
        String location =
                requireNonNull(mockMvc.perform(post("/api/v1/projects/{projectId}/document-folders", inProjectId)
                                .cookie(session)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"name\":\"%s\"}".formatted(name)))
                        .andExpect(status().isCreated())
                        .andReturn()
                        .getResponse()
                        .getHeader("Location"));
        return location.substring(location.lastIndexOf('/') + 1);
    }

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
