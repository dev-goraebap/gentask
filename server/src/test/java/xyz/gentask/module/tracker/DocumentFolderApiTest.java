package xyz.gentask.module.tracker;

import static java.util.Objects.requireNonNull;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
class DocumentFolderApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RecordingMailSender mail;

    private Cookie session;
    private String projectId;

    @BeforeEach
    void 로그인하고_프로젝트를_고른다() throws Exception {
        session = AuthTestSupport.가입한다(mockMvc, mail, "tester-" + UUID.randomUUID() + "@example.com");
        projectId = 프로젝트를_세운다(session, "Gentask", "GT");
    }

    @Test
    @DisplayName("폴더 이름을 입력하여 생성하면 목록에 반영된다")
    void 세우면_목록에_온다() throws Exception {
        폴더를_세운다("{\"name\":\"결정 기록\"}");

        폴더목록().andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("결정 기록"))
                .andExpect(jsonPath("$[0].parentId").value(nullValue()));
    }

    @Test
    @DisplayName("상위 폴더를 지정하여 생성하면 해당 폴더의 하위 계층에 생성된다")
    void 폴더_아래에_세운다() throws Exception {
        String parentId = 폴더를_세운다("{\"name\":\"위\"}");

        폴더를_세운다("{\"name\":\"아래\",\"parentId\":\"%s\"}".formatted(parentId));

        폴더목록().andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[?(@.name == '아래')].parentId").value(parentId));
    }

    /*
     * 계층을 서버가 조립하지 않는다. 평평한 목록에 담긴 자리를 실어 내며 트리로 세우는 것은 읽는
     * 쪽이 한다.
     */
    @Test
    @DisplayName("다단계 계층 폴더도 평탄화된 단일 목록으로 조회되며 각 항목은 부모 폴더 ID를 포함한다")
    void 목록은_평평하게_온다() throws Exception {
        String first = 폴더를_세운다("{\"name\":\"하나\"}");
        String second = 폴더를_세운다("{\"name\":\"둘\",\"parentId\":\"%s\"}".formatted(first));
        폴더를_세운다("{\"name\":\"셋\",\"parentId\":\"%s\"}".formatted(second));

        폴더목록().andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[?(@.name == '둘')].parentId").value(first))
                .andExpect(jsonPath("$[?(@.name == '셋')].parentId").value(second));
    }

    @Test
    @DisplayName("동일 상위 폴더 내에 동일 이름의 폴더가 있어도 중복 생성을 허용한다")
    void 같은_이름을_막지_않는다() throws Exception {
        폴더를_세운다("{\"name\":\"겹치는 이름\"}");
        폴더를_세운다("{\"name\":\"겹치는 이름\"}");

        폴더목록().andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    @DisplayName("폴더 이름이 공백이면 400 오류를 반환하고 생성을 거부한다")
    void 이름이_비어_있으면_세우지_않는다() throws Exception {
        mockMvc.perform(post("/api/v1/projects/{projectId}/document-folders", projectId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"   \"}"))
                .andExpect(status().isBadRequest());

        폴더목록().andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("새 폴더 이름을 지정하여 수정하면 변경된 이름이 반영된다")
    void 이름을_바꾼다() throws Exception {
        String folderId = 폴더를_세운다("{\"name\":\"옛 이름\"}");

        이름을_바꾼다(folderId, "{\"name\":\"새 이름\"}");

        폴더목록().andExpect(jsonPath("$[0].id").value(folderId))
                .andExpect(jsonPath("$[0].name").value("새 이름"));
    }

    @Test
    @DisplayName("수정할 폴더 이름이 공백이면 400 오류를 반환하고 기존 이름을 유지한다")
    void 빈_이름으로는_바꾸지_못한다() throws Exception {
        String folderId = 폴더를_세운다("{\"name\":\"그대로 둘 이름\"}");

        mockMvc.perform(patch("/api/v1/projects/{projectId}/document-folders/{folderId}", projectId, folderId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"   \"}"))
                .andExpect(status().isBadRequest());

        폴더목록().andExpect(jsonPath("$[0].name").value("그대로 둘 이름"));
    }

    @Test
    @DisplayName("폴더를 이동하면 소속 하위 문서 및 자식 폴더가 함께 이동한다")
    void 옮기면_담긴_것이_함께_간다() throws Exception {
        String moving = 폴더를_세운다("{\"name\":\"옮길 것\"}");
        폴더를_세운다("{\"name\":\"하위\",\"parentId\":\"%s\"}".formatted(moving));
        String documentId = 문서를_세운다("{\"title\":\"담긴 문서\",\"folderId\":\"%s\"}".formatted(moving));
        String target = 폴더를_세운다("{\"name\":\"받을 자리\"}");

        옮긴다(moving, "{\"parentId\":\"%s\"}".formatted(target));

        폴더목록().andExpect(jsonPath("$[?(@.name == '옮길 것')].parentId").value(target))
                .andExpect(jsonPath("$[?(@.name == '하위')].parentId").value(moving));
        문서상세(documentId).andExpect(jsonPath("$.summary.folderId").value(moving));
    }

    @Test
    @DisplayName("부모 폴더 ID를 null로 지정하면 최상위 루트로 이동한다")
    void 최상위로_옮긴다() throws Exception {
        String parentId = 폴더를_세운다("{\"name\":\"위\"}");
        String folderId = 폴더를_세운다("{\"name\":\"아래\",\"parentId\":\"%s\"}".formatted(parentId));

        옮긴다(folderId, "{\"parentId\":null}");

        폴더목록().andExpect(jsonPath("$[?(@.parentId == '%s')]".formatted(parentId), hasSize(0)));
    }

    @Test
    @DisplayName("자기 자신 하위로 폴더 이동 시 400 오류를 반환한다")
    void 자기_자신_아래로는_옮기지_못한다() throws Exception {
        String folderId = 폴더를_세운다("{\"name\":\"혼자\"}");

        mockMvc.perform(put("/api/v1/projects/{projectId}/document-folders/{folderId}/parent", projectId, folderId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"parentId\":\"%s\"}".formatted(folderId)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("FOLDER_MOVE_INTO_DESCENDANT"));

        폴더목록().andExpect(jsonPath("$[0].parentId").value(nullValue()));
    }

    @Test
    @DisplayName("자신의 하위 자손 폴더로 폴더 이동 시 400 오류를 반환한다")
    void 자손_아래로는_옮기지_못한다() throws Exception {
        String grandparent = 폴더를_세운다("{\"name\":\"할아버지\"}");
        String parent = 폴더를_세운다("{\"name\":\"아버지\",\"parentId\":\"%s\"}".formatted(grandparent));
        String child = 폴더를_세운다("{\"name\":\"아들\",\"parentId\":\"%s\"}".formatted(parent));

        mockMvc.perform(put("/api/v1/projects/{projectId}/document-folders/{folderId}/parent", projectId, grandparent)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"parentId\":\"%s\"}".formatted(child)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("FOLDER_MOVE_INTO_DESCENDANT"));

        폴더목록().andExpect(jsonPath("$[?(@.parentId == '%s')]".formatted(child), hasSize(0)));
    }

    @Test
    @DisplayName("폴더 삭제 시 소속 문서와 하위 폴더는 상위 계층으로 승격된다")
    void 지우면_담긴_것이_한_단계_위로_올라간다() throws Exception {
        String grandparent = 폴더를_세운다("{\"name\":\"위\"}");
        String folderId = 폴더를_세운다("{\"name\":\"지울 것\",\"parentId\":\"%s\"}".formatted(grandparent));
        폴더를_세운다("{\"name\":\"하위\",\"parentId\":\"%s\"}".formatted(folderId));
        String documentId = 문서를_세운다("{\"title\":\"담긴 문서\",\"folderId\":\"%s\"}".formatted(folderId));

        지운다(folderId);

        폴더목록().andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[?(@.name == '하위')].parentId").value(grandparent));
        문서상세(documentId).andExpect(jsonPath("$.summary.folderId").value(grandparent));
    }

    @Test
    @DisplayName("최상위 폴더 삭제 시 소속 항목들은 루트 계층으로 이동한다")
    void 최상위를_지우면_뿌리로_올라간다() throws Exception {
        String folderId = 폴더를_세운다("{\"name\":\"지울 것\"}");
        String documentId = 문서를_세운다("{\"title\":\"담긴 문서\",\"folderId\":\"%s\"}".formatted(folderId));

        지운다(folderId);

        폴더목록().andExpect(jsonPath("$", hasSize(0)));
        문서상세(documentId).andExpect(jsonPath("$.summary.folderId").value(nullValue()));
    }

    /*
     * 지우기 전에 몇이 한 단계 위로 올라오는지 되묻는 자리가 이 수를 쓴다. 되묻는 것은 화면이 하고
     * 서버는 셀 수 있게 한다.
     */
    @Test
    @DisplayName("폴더 목록 조회 시 직속 하위 문서 수와 폴더 수를 포함한다")
    void 담긴_것의_수를_센다() throws Exception {
        String folderId = 폴더를_세운다("{\"name\":\"담은 것이 있는 자리\"}");
        폴더를_세운다("{\"name\":\"하위\",\"parentId\":\"%s\"}".formatted(folderId));
        문서를_세운다("{\"title\":\"하나\",\"folderId\":\"%s\"}".formatted(folderId));
        문서를_세운다("{\"title\":\"둘\",\"folderId\":\"%s\"}".formatted(folderId));

        폴더목록().andExpect(jsonPath("$[?(@.name == '담은 것이 있는 자리')].documentCount").value(2))
                .andExpect(jsonPath("$[?(@.name == '담은 것이 있는 자리')].folderCount").value(1))
                .andExpect(jsonPath("$[?(@.name == '하위')].documentCount").value(0));
    }

    @Test
    @DisplayName("폴더 목록 조회 시 현재 프로젝트의 폴더만 반환한다")
    void 목록은_지금_프로젝트의_것만_낸다() throws Exception {
        폴더를_세운다("{\"name\":\"이 프로젝트의 것\"}");

        String other = 프로젝트를_세운다(session, "Other", "OT");

        mockMvc.perform(get("/api/v1/projects/{projectId}/document-folders", other)
                        .cookie(session))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("타 사용자의 프로젝트 폴더 조회 시 404를 반환한다")
    void 남의_폴더에는_닿지_못한다() throws Exception {
        String folderId = 폴더를_세운다("{\"name\":\"내 것\"}");

        String other = 프로젝트를_세운다(session, "Other", "OT");

        mockMvc.perform(patch("/api/v1/projects/{projectId}/document-folders/{folderId}", other, folderId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"바꾸기\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("FOLDER_NOT_FOUND"));
    }

    @Test
    @DisplayName("이미 삭제된 폴더의 이동 또는 삭제 요청 시 404를 반환한다")
    void 이미_지워진_폴더는_없는_것으로_낸다() throws Exception {
        String folderId = 폴더를_세운다("{\"name\":\"지울 것\"}");
        지운다(folderId);

        mockMvc.perform(put("/api/v1/projects/{projectId}/document-folders/{folderId}/parent", projectId, folderId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"parentId\":null}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("FOLDER_NOT_FOUND"));

        mockMvc.perform(delete("/api/v1/projects/{projectId}/document-folders/{folderId}", projectId, folderId)
                        .cookie(session))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("FOLDER_NOT_FOUND"));
    }

    @Test
    @DisplayName("유효하지 않은 형식의 폴더 식별자 접근 시 404를 반환한다")
    void 모양이_아닌_식별자는_없는_것으로_낸다() throws Exception {
        mockMvc.perform(delete("/api/v1/projects/{projectId}/document-folders/{folderId}", projectId, "폴더-아님")
                        .cookie(session))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("FOLDER_NOT_FOUND"));
    }

    @Test
    @DisplayName("타 사용자의 프로젝트에 폴더 생성 요청 시 404를 반환한다")
    void 남의_프로젝트에는_세우지_못한다() throws Exception {
        Cookie other = AuthTestSupport.가입한다(mockMvc, mail, "other-" + UUID.randomUUID() + "@example.com");

        mockMvc.perform(post("/api/v1/projects/{projectId}/document-folders", projectId)
                        .cookie(other)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"남의 자리\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PROJECT_NOT_FOUND"));
    }

    @Test
    @DisplayName("인증되지 않은 사용자의 폴더 접근을 거부한다")
    void 로그인_없이_폴더에_닿을_수_없다() throws Exception {
        mockMvc.perform(get("/api/v1/projects/{projectId}/document-folders", projectId))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    // --- 준비 --------------------------------------------------------------------------------------------------------
    private ResultActions 폴더목록() throws Exception {
        return mockMvc.perform(get("/api/v1/projects/{projectId}/document-folders", projectId)
                        .cookie(session))
                .andExpect(status().isOk());
    }

    private String 폴더를_세운다(String body) throws Exception {
        String location =
                requireNonNull(mockMvc.perform(post("/api/v1/projects/{projectId}/document-folders", projectId)
                                .cookie(session)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                        .andExpect(status().isCreated())
                        .andReturn()
                        .getResponse()
                        .getHeader("Location"));
        return location.substring(location.lastIndexOf('/') + 1);
    }

    private void 이름을_바꾼다(String folderId, String body) throws Exception {
        mockMvc.perform(patch("/api/v1/projects/{projectId}/document-folders/{folderId}", projectId, folderId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNoContent());
    }

    private void 옮긴다(String folderId, String body) throws Exception {
        mockMvc.perform(put("/api/v1/projects/{projectId}/document-folders/{folderId}/parent", projectId, folderId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNoContent());
    }

    private void 지운다(String folderId) throws Exception {
        mockMvc.perform(delete("/api/v1/projects/{projectId}/document-folders/{folderId}", projectId, folderId)
                        .cookie(session))
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

    private ResultActions 문서상세(String documentId) throws Exception {
        return mockMvc.perform(get("/api/v1/projects/{projectId}/documents/{documentId}", projectId, documentId)
                        .cookie(session))
                .andExpect(status().isOk());
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
