package xyz.gentask.module.tracker;

import static java.util.Objects.requireNonNull;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
class IssueApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RecordingMailSender mail;

    private Cookie session;
    private String projectKey;

    @BeforeEach
    void 로그인하고_프로젝트를_고른다() throws Exception {
        session = AuthTestSupport.가입한다(mockMvc, mail, "tester-" + UUID.randomUUID() + "@example.com");
        projectKey = 프로젝트를_세운다(session, "Gentask");
    }

    @Test
    @DisplayName("TG-043 #1: 제목을 적어 세우면 지금 프로젝트의 다음 번호를 받는다")
    void 세우면_다음_번호를_받는다() throws Exception {
        작업_아이템을_세운다("{\"title\":\"첫 것\"}");
        작업_아이템을_세운다("{\"title\":\"둘째 것\"}");

        mockMvc.perform(get("/api/v1/projects/{key}/issues", projectKey).cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].number").value(1))
                .andExpect(jsonPath("$[0].key").value("GE-001"))
                .andExpect(jsonPath("$[1].number").value(2))
                .andExpect(jsonPath("$[1].key").value("GE-002"));
    }

    @Test
    @DisplayName("TG-043 #2: 유형을 고르지 않고 세우면 TASK 다")
    void 유형을_고르지_않으면_TASK_다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"유형 없이\"}");

        상세(number).andExpect(jsonPath("$.summary.kind").value("TASK"));
    }

    @Test
    @DisplayName("고른 유형이 있으면 그것으로 선다")
    void 고른_유형으로_선다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"버그\",\"kind\":\"BUG\"}");

        상세(number).andExpect(jsonPath("$.summary.kind").value("BUG"));
    }

    @Test
    @DisplayName("TG-043 #3: 본문을 적어 세우면 그 본문을 그대로 담는다")
    void 본문을_그대로_담는다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"본문 있는 것\",\"body\":\"첫 줄\\n\\n둘째 줄\"}");

        상세(number).andExpect(jsonPath("$.body").value("첫 줄\n\n둘째 줄"));
    }

    /*
     * 화면의 편집기(ProseMirror 계열)는 마크다운을 문서 모델로 바꿨다가 되돌리며 HTML 주석을 담을
     * 자리를 갖지 않아 통째로 버린다. 예전 마커에 기대면 저장하는 순간 인수 조건이 사라진다.
     * 실제로 tiptap-markdown 으로 왕복시켜 확인한 것이며, 체크 항목 자체는 온전히 살아남는다.
     */
    @Test
    @DisplayName("마커가 없어도 번호가 붙은 체크 항목을 인수 조건으로 읽는다")
    void 마커가_없어도_인수_조건을_읽는다() throws Exception {
        String body = "설명\\n\\n## 인수 조건\\n\\n" + "- [x] #1 첫 조건\\n" + "- [ ] #2 둘째 조건\\n" + "- [ ] #3 (결번)";
        int number = 작업_아이템을_세운다("{\"title\":\"마커 없음\",\"body\":\"%s\"}".formatted(body));

        상세(number)
                .andExpect(jsonPath("$.summary.criteriaCount").value(2))
                .andExpect(jsonPath("$.summary.unverifiedCount").value(1))
                .andExpect(jsonPath("$.criteria", hasSize(3)));
    }

    @Test
    @DisplayName("인수 조건은 표가 아니라 본문에서 읽는다")
    void 인수_조건을_본문에서_읽는다() throws Exception {
        String body = "설명\\n\\n<!-- AC:BEGIN -->\\n"
                + "- [x] #1 첫 조건\\n"
                + "- [ ] #2 둘째 조건\\n"
                + "- [ ] #3 (결번)\\n"
                + "<!-- AC:END -->";
        int number = 작업_아이템을_세운다("{\"title\":\"인수 조건\",\"body\":\"%s\"}".formatted(body));

        // 결번은 세지 않는다. 번호를 비워 두기 위한 자리이며 검증 대상이 아니다.
        상세(number)
                .andExpect(jsonPath("$.summary.criteriaCount").value(2))
                .andExpect(jsonPath("$.summary.unverifiedCount").value(1))
                .andExpect(jsonPath("$.criteria", hasSize(3)))
                .andExpect(jsonPath("$.criteria[0].verified").value(true))
                .andExpect(jsonPath("$.criteria[2].retired").value(true));
    }

    @Test
    @DisplayName("TG-043 #4: 제목이 비어 있으면 제목이 필요함을 알린다")
    void 제목이_비어_있으면_알린다() throws Exception {
        mockMvc.perform(post("/api/v1/projects/{key}/issues", projectKey)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"   \"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TG-043 #6: 목록을 열면 지금 프로젝트의 작업 아이템만 온다")
    void 목록은_지금_프로젝트의_것만_낸다() throws Exception {
        작업_아이템을_세운다("{\"title\":\"이 프로젝트의 것\"}");

        String other = 프로젝트를_세운다(session, "Other");

        mockMvc.perform(get("/api/v1/projects/{key}/issues", projectKey).cookie(session))
                .andExpect(jsonPath("$", hasSize(1)));
        mockMvc.perform(get("/api/v1/projects/{key}/issues", other).cookie(session))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("TG-043 #7: 하나를 열면 본문과 부모를 함께 낸다")
    void 상세는_본문과_부모를_함께_낸다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"부모 없는 것\",\"body\":\"본문\"}");

        상세(number)
                .andExpect(jsonPath("$.body").value("본문"))
                .andExpect(jsonPath("$.summary.parentKey", nullValue()))
                .andExpect(jsonPath("$.summary.childCount").value(0))
                // 세운 사람은 별명으로 낸다. 상세 한 줄이 그것을 쓴다.
                .andExpect(jsonPath("$.authorName").isNotEmpty());
    }

    @Test
    @DisplayName("TG-043 #8: 지금 프로젝트에 없는 번호는 없는 것으로 낸다")
    void 없는_번호는_없는_것으로_낸다() throws Exception {
        작업_아이템을_세운다("{\"title\":\"하나뿐\"}");

        String other = 프로젝트를_세운다(session, "Other");

        // 다른 프로젝트에 같은 번호가 있어도 여기에는 없다. 번호는 프로젝트 안에서만 유일하다.
        mockMvc.perform(get("/api/v1/projects/{key}/issues/{number}", other, 1).cookie(session))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ISSUE_NOT_FOUND"));
    }

    @Test
    @DisplayName("TG-055 #1: 제목과 본문을 고쳐 담으면 고친 것이 남는다")
    void 고친_것이_남는다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"처음 제목\",\"body\":\"처음 본문\"}");

        고친다(number, "{\"title\":\"고친 제목\",\"kind\":\"BUG\",\"body\":\"고친 본문\",\"parentKey\":null}");

        상세(number)
                .andExpect(jsonPath("$.summary.title").value("고친 제목"))
                .andExpect(jsonPath("$.body").value("고친 본문"));
    }

    @Test
    @DisplayName("TG-055 #2: 본문의 체크 항목을 고치면 바뀐 인수 조건을 그대로 읽는다")
    void 본문을_고치면_인수_조건도_바뀐다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"인수 조건\",\"body\":\"- [ ] #1 첫 조건\"}");

        상세(number).andExpect(jsonPath("$.summary.unverifiedCount").value(1));

        고친다(
                number,
                "{\"title\":\"인수 조건\",\"kind\":\"TASK\",\"parentKey\":null,"
                        + "\"body\":\"- [x] #1 첫 조건\\n- [ ] #2 둘째 조건\"}");
        상세(number)
                .andExpect(jsonPath("$.summary.criteriaCount").value(2))
                .andExpect(jsonPath("$.summary.unverifiedCount").value(1))
                .andExpect(jsonPath("$.criteria[0].verified").value(true));
    }

    @Test
    @DisplayName("TG-055 #3: 제목이 비어 있으면 알리고 고치기 전의 것을 그대로 둔다")
    void 제목이_비면_고치지_않는다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"그대로 둘 것\"}");

        mockMvc.perform(patch("/api/v1/projects/{key}/issues/{number}", projectKey, number)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"   \",\"kind\":\"TASK\",\"body\":\"\",\"parentKey\":null}"))
                .andExpect(status().isBadRequest());

        상세(number).andExpect(jsonPath("$.summary.title").value("그대로 둘 것"));
    }

    @Test
    @DisplayName("TG-055 #5: 유형을 바꿔도 번호는 그대로다")
    void 유형을_바꿔도_번호는_그대로다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"유형 바꿀 것\",\"kind\":\"TASK\"}");

        고친다(number, "{\"title\":\"유형 바꿀 것\",\"kind\":\"EPIC\",\"body\":\"\",\"parentKey\":null}");

        상세(number)
                .andExpect(jsonPath("$.summary.kind").value("EPIC"))
                .andExpect(jsonPath("$.summary.number").value(number));
    }

    @Test
    @DisplayName("TG-055 #6: 사용자의 프로젝트에 속하지 않으면 없는 것으로 낸다")
    void 남의_것은_고치지_못한다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"내 것\"}");

        Cookie other = AuthTestSupport.가입한다(mockMvc, mail, "other-" + UUID.randomUUID() + "@example.com");

        mockMvc.perform(patch("/api/v1/projects/{key}/issues/{number}", projectKey, number)
                        .cookie(other)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"바꾸기\",\"kind\":\"TASK\",\"body\":\"\",\"parentKey\":null}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PROJECT_NOT_FOUND"));
    }

    /*
     * 계층을 번호가 갖지 않으므로(결정-0007) 부모를 잇는 길이 따로 있어야 한다. 이것이 없으면
     * 명령줄로 Epic 아래 Story 를 세울 수 없어 백로그를 CLI 로 다루지 못한다.
     */
    @Test
    @DisplayName("세울 때와 고칠 때 부모를 이을 수 있다")
    void 부모를_이을_수_있다() throws Exception {
        int epic = 작업_아이템을_세운다("{\"title\":\"묶는 것\",\"kind\":\"EPIC\"}");
        String epicKey = "GE-%03d".formatted(epic);

        int child = 작업_아이템을_세운다(
                "{\"title\":\"아래 것\",\"kind\":\"STORY\",\"parentKey\":%s}".formatted("\"%s\"".formatted(epicKey)));

        상세(child).andExpect(jsonPath("$.summary.parentKey").value(epicKey));
        상세(epic).andExpect(jsonPath("$.summary.childCount").value(1));

        // 비우면 최상위로 돌아간다.
        고친다(child, "{\"title\":\"아래 것\",\"kind\":\"STORY\",\"body\":\"\",\"parentKey\":null}");
        상세(child).andExpect(jsonPath("$.summary.parentKey").doesNotExist());
    }

    @Test
    @DisplayName("TG-044 #1: 상태를 옮기면 그 상태가 항목에 남는다")
    void 상태를_옮기면_남는다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"옮길 것\"}");

        상세(number).andExpect(jsonPath("$.summary.state").value("BACKLOG"));

        상태를_옮긴다(number, "STARTED");

        상세(number).andExpect(jsonPath("$.summary.state").value("STARTED"));
    }

    @Test
    @DisplayName("TG-044 #2: 완료나 취소로 옮기면 그 순간이 닫힌 때로 남는다")
    void 닫으면_닫힌_때가_남는다() throws Exception {
        int completed = 작업_아이템을_세운다("{\"title\":\"끝낸 것\"}");
        int canceled = 작업_아이템을_세운다("{\"title\":\"거둔 것\"}");

        상태를_옮긴다(completed, "COMPLETED");
        상태를_옮긴다(canceled, "CANCELED");

        상세(completed).andExpect(jsonPath("$.summary.closedAt").isNotEmpty());
        상세(canceled).andExpect(jsonPath("$.summary.closedAt").isNotEmpty());
    }

    @Test
    @DisplayName("TG-044 #3: 닫힌 것을 되돌리면 닫힌 때를 지운다")
    void 되돌리면_닫힌_때를_지운다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"되돌릴 것\"}");

        상태를_옮긴다(number, "COMPLETED");
        상태를_옮긴다(number, "STARTED");

        상세(number).andExpect(jsonPath("$.summary.closedAt", nullValue()));
    }

    @Test
    @DisplayName("TG-044 #4: 이미 그 상태이면 아무것도 바꾸지 않는다")
    void 같은_상태로_옮기면_바뀌지_않는다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"그대로 둘 것\"}");

        상태를_옮긴다(number, "COMPLETED");
        String closedAt =
                JsonPath.read(상세(number).andReturn().getResponse().getContentAsString(), "$.summary.closedAt");

        상태를_옮긴다(number, "COMPLETED");

        // 다시 찍으면 처음 닫은 순간을 잃는다.
        상세(number).andExpect(jsonPath("$.summary.closedAt").value(closedAt));
    }

    @Test
    @DisplayName("TG-044 #5: 사용자의 프로젝트에 속하지 않으면 없는 것으로 낸다")
    void 남의_프로젝트의_항목은_없는_것으로_낸다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"내 것\"}");

        Cookie other = AuthTestSupport.가입한다(mockMvc, mail, "other-" + UUID.randomUUID() + "@example.com");

        mockMvc.perform(patch("/api/v1/projects/{key}/issues/{number}/state", projectKey, number)
                        .cookie(other)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"state\":\"STARTED\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PROJECT_NOT_FOUND"));
    }

    @Test
    @DisplayName("로그인 없이 작업 아이템에 닿을 수 없다")
    void 로그인_없이_작업_아이템에_닿을_수_없다() throws Exception {
        mockMvc.perform(get("/api/v1/projects/{key}/issues", projectKey))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    // --- 준비 --------------------------------------------------------------------------------------------------------
    private ResultActions 상세(int number) throws Exception {
        return mockMvc.perform(get("/api/v1/projects/{key}/issues/{number}", projectKey, number)
                        .cookie(session))
                .andExpect(status().isOk());
    }

    private void 고친다(int number, String body) throws Exception {
        mockMvc.perform(patch("/api/v1/projects/{key}/issues/{number}", projectKey, number)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNoContent());
    }

    private void 상태를_옮긴다(int number, String state) throws Exception {
        mockMvc.perform(patch("/api/v1/projects/{key}/issues/{number}/state", projectKey, number)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"state\":\"%s\"}".formatted(state)))
                .andExpect(status().isNoContent());
    }

    private int 작업_아이템을_세운다(String body) throws Exception {
        String location = requireNonNull(mockMvc.perform(post("/api/v1/projects/{key}/issues", projectKey)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location"));
        return Integer.parseInt(location.substring(location.lastIndexOf('/') + 1));
    }

    private String 프로젝트를_세운다(Cookie cookie, String name) throws Exception {
        String location = requireNonNull(mockMvc.perform(post("/api/v1/projects")
                        .cookie(cookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"%s\"}".formatted(name)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location"));
        return location.substring(location.lastIndexOf('/') + 1);
    }
}
