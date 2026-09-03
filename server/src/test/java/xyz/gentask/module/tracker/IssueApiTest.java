package xyz.gentask.module.tracker;

import static java.util.Objects.requireNonNull;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
    private String projectId;

    /** 이 시험이 세우는 프로젝트의 접두어. 이슈 이름이 이것을 앞에 단다. */
    private static final String 접두어 = "GT";

    @BeforeEach
    void 로그인하고_프로젝트를_고른다() throws Exception {
        session = AuthTestSupport.가입한다(mockMvc, mail, "tester-" + UUID.randomUUID() + "@example.com");
        projectId = 프로젝트를_세운다(session, "Gentask", 접두어);
    }

    @Test
    @DisplayName("작업 항목 생성 시 해당 프로젝트의 다음 일련번호를 부여한다")
    void 세우면_다음_번호를_받는다() throws Exception {
        작업_아이템을_세운다("{\"title\":\"첫 것\"}");
        작업_아이템을_세운다("{\"title\":\"둘째 것\"}");

        mockMvc.perform(get("/api/v1/projects/{projectId}/issues", projectId).cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].number").value(1))
                .andExpect(jsonPath("$[0].key").value("GT-1"))
                .andExpect(jsonPath("$[1].number").value(2))
                .andExpect(jsonPath("$[1].key").value("GT-2"));
    }

    @Test
    @DisplayName("유형을 지정하지 않고 생성하면 기본값으로 TASK 유형이 지정된다")
    void 유형을_고르지_않으면_TASK_다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"유형 없이\"}");

        상세(number).andExpect(jsonPath("$.summary.kind").value("TASK"));
    }

    @Test
    @DisplayName("지정한 작업 항목 유형으로 정상 생성된다")
    void 고른_유형으로_선다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"버그\",\"kind\":\"BUG\"}");

        상세(number).andExpect(jsonPath("$.summary.kind").value("BUG"));
    }

    @Test
    @DisplayName("본문을 입력하여 생성하면 해당 본문을 그대로 저장한다")
    void 본문을_그대로_담는다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"본문 있는 것\",\"body\":\"첫 줄\\n\\n둘째 줄\"}");

        상세(number).andExpect(jsonPath("$.body").value("첫 줄\n\n둘째 줄"));
    }

    /*
     * 에디터(tiptap-markdown) 변환 과정에서 HTML 주석 마커가 유실되므로, 마커 유무와 무관하게 체크박스 항목 자체를 파싱하여 인수 조건으로 인식한다.
     */
    @Test
    @DisplayName("주석 마커가 없어도 번호가 부여된 체크 항목을 인수 조건으로 파싱한다")
    void 마커가_없어도_인수_조건을_읽는다() throws Exception {
        String body = "설명\\n\\n## 인수 조건\\n\\n" + "- [x] #1 첫 조건\\n" + "- [ ] #2 둘째 조건\\n" + "- [ ] #3 (결번)";
        int number = 작업_아이템을_세운다("{\"title\":\"마커 없음\",\"body\":\"%s\"}".formatted(body));

        상세(number)
                .andExpect(jsonPath("$.summary.criteriaCount").value(2))
                .andExpect(jsonPath("$.summary.unverifiedCount").value(1))
                .andExpect(jsonPath("$.criteria", hasSize(3)));
    }

    @Test
    @DisplayName("본문 내 체크 항목으로부터 인수 조건 목록과 검증 상태를 파싱한다")
    void 인수_조건을_본문에서_읽는다() throws Exception {
        String body = "설명\\n\\n<!-- AC:BEGIN -->\\n"
                + "- [x] #1 첫 조건\\n"
                + "- [ ] #2 둘째 조건\\n"
                + "- [ ] #3 (결번)\\n"
                + "<!-- AC:END -->";
        int number = 작업_아이템을_세운다("{\"title\":\"인수 조건\",\"body\":\"%s\"}".formatted(body));

        // 결번 처리된 항목은 검증 대상 인수 조건 개수 집계에서 제외한다.
        상세(number)
                .andExpect(jsonPath("$.summary.criteriaCount").value(2))
                .andExpect(jsonPath("$.summary.unverifiedCount").value(1))
                .andExpect(jsonPath("$.criteria", hasSize(3)))
                .andExpect(jsonPath("$.criteria[0].verified").value(true))
                .andExpect(jsonPath("$.criteria[2].retired").value(true));
    }

    @Test
    @DisplayName("제목이 공백이면 유효성 검증 오류를 반환한다")
    void 제목이_비어_있으면_알린다() throws Exception {
        mockMvc.perform(post("/api/v1/projects/{projectId}/issues", projectId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"   \"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("목록 조회 시 현재 프로젝트의 작업 항목만 반환한다")
    void 목록은_지금_프로젝트의_것만_낸다() throws Exception {
        작업_아이템을_세운다("{\"title\":\"이 프로젝트의 것\"}");

        String other = 프로젝트를_세운다(session, "Other", "OT");

        mockMvc.perform(get("/api/v1/projects/{projectId}/issues", projectId).cookie(session))
                .andExpect(jsonPath("$", hasSize(1)));
        mockMvc.perform(get("/api/v1/projects/{projectId}/issues", other).cookie(session))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("상세 조회 시 본문과 부모 작업 항목 정보를 함께 반환한다")
    void 상세는_본문과_부모를_함께_낸다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"부모 없는 것\",\"body\":\"본문\"}");

        상세(number)
                .andExpect(jsonPath("$.body").value("본문"))
                .andExpect(jsonPath("$.summary.parentKey", nullValue()))
                .andExpect(jsonPath("$.summary.childCount").value(0))
                // 작성자는 닉네임으로 응답에 포함한다.
                .andExpect(jsonPath("$.authorName").isNotEmpty());
    }

    @Test
    @DisplayName("현재 프로젝트에 속하지 않는 작업 번호 조회 시 404를 반환한다")
    void 없는_번호는_없는_것으로_낸다() throws Exception {
        작업_아이템을_세운다("{\"title\":\"하나뿐\"}");

        String other = 프로젝트를_세운다(session, "Other", "OT");

        // 작업 번호는 프로젝트 단위로 독립 채번되므로 타 프로젝트의 번호는 조회할 수 없다.
        mockMvc.perform(get("/api/v1/projects/{projectId}/issues/{number}", other, 1)
                        .cookie(session))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ISSUE_NOT_FOUND"));
    }

    @Test
    @DisplayName("제목과 본문을 수정하면 변경 내용이 반영된다")
    void 고친_것이_남는다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"처음 제목\",\"body\":\"처음 본문\"}");

        고친다(number, "{\"title\":\"고친 제목\",\"kind\":\"BUG\",\"body\":\"고친 본문\",\"parentKey\":null}");

        상세(number)
                .andExpect(jsonPath("$.summary.title").value("고친 제목"))
                .andExpect(jsonPath("$.body").value("고친 본문"));
    }

    @Test
    @DisplayName("본문의 체크 항목 수정 시 변경된 인수 조건 상태를 반영한다")
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
    @DisplayName("수정 요청의 제목이 공백이면 400 오류를 반환하고 기존 내용을 유지한다")
    void 제목이_비면_고치지_않는다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"그대로 둘 것\"}");

        mockMvc.perform(patch("/api/v1/projects/{projectId}/issues/{number}", projectId, number)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"   \",\"kind\":\"TASK\",\"body\":\"\",\"parentKey\":null}"))
                .andExpect(status().isBadRequest());

        상세(number).andExpect(jsonPath("$.summary.title").value("그대로 둘 것"));
    }

    @Test
    @DisplayName("작업 항목 유형을 변경해도 고유 번호는 유지된다")
    void 유형을_바꿔도_번호는_그대로다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"유형 바꿀 것\",\"kind\":\"TASK\"}");

        고친다(number, "{\"title\":\"유형 바꿀 것\",\"kind\":\"EPIC\",\"body\":\"\",\"parentKey\":null}");

        상세(number)
                .andExpect(jsonPath("$.summary.kind").value("EPIC"))
                .andExpect(jsonPath("$.summary.number").value(number));
    }

    @Test
    @DisplayName("타 사용자의 프로젝트 내 작업 항목 수정 요청 시 404를 반환한다")
    void 남의_것은_고치지_못한다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"내 것\"}");

        Cookie other = AuthTestSupport.가입한다(mockMvc, mail, "other-" + UUID.randomUUID() + "@example.com");

        mockMvc.perform(patch("/api/v1/projects/{projectId}/issues/{number}", projectId, number)
                        .cookie(other)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"바꾸기\",\"kind\":\"TASK\",\"body\":\"\",\"parentKey\":null}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PROJECT_NOT_FOUND"));
    }

    /*
     * 작업 번호와 무관하게 계층 구조를 형성할 수 있도록 생성 및 수정 시 부모 작업(parentKey)을 지정할 수 있다.
     */
    @Test
    @DisplayName("생성 및 수정 시 부모 작업 항목을 연결할 수 있다")
    void 부모를_이을_수_있다() throws Exception {
        int epic = 작업_아이템을_세운다("{\"title\":\"묶는 것\",\"kind\":\"EPIC\"}");
        String epicKey = "%s-%d".formatted(접두어, epic);

        int child = 작업_아이템을_세운다(
                "{\"title\":\"아래 것\",\"kind\":\"STORY\",\"parentKey\":%s}".formatted("\"%s\"".formatted(epicKey)));

        상세(child).andExpect(jsonPath("$.summary.parentKey").value(epicKey));
        상세(epic).andExpect(jsonPath("$.summary.childCount").value(1));

        // parentKey를 null로 설정하면 상위 계층 연결을 해제한다.
        고친다(child, "{\"title\":\"아래 것\",\"kind\":\"STORY\",\"body\":\"\",\"parentKey\":null}");
        상세(child).andExpect(jsonPath("$.summary.parentKey").doesNotExist());
    }

    @Test
    @DisplayName("작업 상태를 변경하면 변경된 상태가 유지된다")
    void 상태를_옮기면_남는다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"옮길 것\"}");

        상세(number).andExpect(jsonPath("$.summary.state").value("BACKLOG"));

        상태를_옮긴다(number, "STARTED");

        상세(number).andExpect(jsonPath("$.summary.state").value("STARTED"));
    }

    @Test
    @DisplayName("완료(COMPLETED) 또는 취소(CANCELED) 상태로 변경 시 종료 시각을 기록한다")
    void 닫으면_닫힌_때가_남는다() throws Exception {
        int completed = 작업_아이템을_세운다("{\"title\":\"끝낸 것\"}");
        int canceled = 작업_아이템을_세운다("{\"title\":\"거둔 것\"}");

        상태를_옮긴다(completed, "COMPLETED");
        상태를_옮긴다(canceled, "CANCELED");

        상세(completed).andExpect(jsonPath("$.summary.closedAt").isNotEmpty());
        상세(canceled).andExpect(jsonPath("$.summary.closedAt").isNotEmpty());
    }

    @Test
    @DisplayName("종료 상태에서 진행 상태로 복귀 시 종료 시각을 초기화한다")
    void 되돌리면_닫힌_때를_지운다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"되돌릴 것\"}");

        상태를_옮긴다(number, "COMPLETED");
        상태를_옮긴다(number, "STARTED");

        상세(number).andExpect(jsonPath("$.summary.closedAt", nullValue()));
    }

    @Test
    @DisplayName("동일한 상태로 변경 요청 시 상태와 종료 시각을 변경하지 않는다")
    void 같은_상태로_옮기면_바뀌지_않는다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"그대로 둘 것\"}");

        상태를_옮긴다(number, "COMPLETED");
        String closedAt =
                JsonPath.read(상세(number).andReturn().getResponse().getContentAsString(), "$.summary.closedAt");

        상태를_옮긴다(number, "COMPLETED");

        // 중복 변경 요청 시 최초 종료 시각이 갱신되지 않아야 한다.
        상세(number).andExpect(jsonPath("$.summary.closedAt").value(closedAt));
    }

    @Test
    @DisplayName("타 사용자의 프로젝트 내 작업 항목 수정 요청 시 404를 반환한다")
    void 남의_프로젝트의_항목은_없는_것으로_낸다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"내 것\"}");

        Cookie other = AuthTestSupport.가입한다(mockMvc, mail, "other-" + UUID.randomUUID() + "@example.com");

        mockMvc.perform(patch("/api/v1/projects/{projectId}/issues/{number}/state", projectId, number)
                        .cookie(other)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"state\":\"STARTED\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PROJECT_NOT_FOUND"));
    }

    @Test
    @DisplayName("작업 항목을 삭제하면 조회되지 않는다")
    void 지우면_그_자리가_사라진다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"걷을 것\"}");

        지운다(number);

        mockMvc.perform(get("/api/v1/projects/{projectId}/issues/{number}", projectId, number)
                        .cookie(session))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ISSUE_NOT_FOUND"));
    }

    @Test
    @DisplayName("작업 항목 삭제 후 신규 생성 시 삭제된 번호를 재사용하지 않는다")
    void 지운_것의_번호를_다시_쓰지_않는다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"지울 것\"}");

        지운다(number);
        작업_아이템을_세운다("{\"title\":\"뒤에 세울 것\"}");

        // 번호는 기존 번호의 최댓값이 아닌 프로젝트 시퀀스로부터 발급하여 결번 재사용을 방지한다.
        mockMvc.perform(get("/api/v1/projects/{projectId}/issues", projectId).cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].number").value(number + 1));
    }

    @Test
    @DisplayName("부모 작업 삭제 시 하위 작업은 삭제하지 않고 최상위 계층으로 전환한다")
    void 지운_것의_자식은_최상위로_올라간다() throws Exception {
        int parent = 작업_아이템을_세운다("{\"title\":\"덮는 에픽\",\"kind\":\"EPIC\"}");
        int child = 작업_아이템을_세운다("{\"title\":\"딸린 것\",\"parentKey\":\"%s-%d\"}".formatted(접두어, parent));

        지운다(parent);

        상세(child).andExpect(jsonPath("$.summary.parentKey").value(nullValue()));
    }

    @Test
    @DisplayName("타 사용자의 프로젝트 내 작업 항목 수정 요청 시 404를 반환한다")
    void 남의_프로젝트의_항목은_지우지_못한다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"내 것\"}");

        Cookie other = AuthTestSupport.가입한다(mockMvc, mail, "other-" + UUID.randomUUID() + "@example.com");

        mockMvc.perform(delete("/api/v1/projects/{projectId}/issues/{number}", projectId, number)
                        .cookie(other))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PROJECT_NOT_FOUND"));
    }

    @Test
    @DisplayName("이미 삭제된 작업 번호 삭제 요청 시 404를 반환한다")
    void 이미_지워진_번호는_없는_것으로_낸다() throws Exception {
        int number = 작업_아이템을_세운다("{\"title\":\"두 번 지울 것\"}");
        지운다(number);

        mockMvc.perform(delete("/api/v1/projects/{projectId}/issues/{number}", projectId, number)
                        .cookie(session))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ISSUE_NOT_FOUND"));
    }

    @Test
    @DisplayName("인증되지 않은 사용자의 작업 항목 조회를 거부한다")
    void 로그인_없이_작업_아이템에_닿을_수_없다() throws Exception {
        mockMvc.perform(get("/api/v1/projects/{projectId}/issues", projectId))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    // --- 준비 --------------------------------------------------------------------------------------------------------
    private ResultActions 상세(int number) throws Exception {
        return mockMvc.perform(get("/api/v1/projects/{projectId}/issues/{number}", projectId, number)
                        .cookie(session))
                .andExpect(status().isOk());
    }

    private void 고친다(int number, String body) throws Exception {
        mockMvc.perform(patch("/api/v1/projects/{projectId}/issues/{number}", projectId, number)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNoContent());
    }

    private void 상태를_옮긴다(int number, String state) throws Exception {
        mockMvc.perform(patch("/api/v1/projects/{projectId}/issues/{number}/state", projectId, number)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"state\":\"%s\"}".formatted(state)))
                .andExpect(status().isNoContent());
    }

    private void 지운다(int number) throws Exception {
        mockMvc.perform(delete("/api/v1/projects/{projectId}/issues/{number}", projectId, number)
                        .cookie(session))
                .andExpect(status().isNoContent());
    }

    private int 작업_아이템을_세운다(String body) throws Exception {
        String location = requireNonNull(mockMvc.perform(post("/api/v1/projects/{projectId}/issues", projectId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location"));
        return Integer.parseInt(location.substring(location.lastIndexOf('/') + 1));
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
