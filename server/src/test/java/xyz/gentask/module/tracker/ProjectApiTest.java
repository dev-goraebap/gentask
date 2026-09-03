package xyz.gentask.module.tracker;

import static java.util.Objects.requireNonNull;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.AuthTestSupport;
import xyz.gentask.FakeMailConfiguration;
import xyz.gentask.TestcontainersConfiguration;
import xyz.gentask.module.tracker.domain.project.ProjectPublicId;
import xyz.gentask.shared.mail.E2eMailSupport.RecordingMailSender;

@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, FakeMailConfiguration.class})
@Transactional
class ProjectApiTest {

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
    @DisplayName("신규 계정 생성 시 기본 프로젝트가 함께 생성된다")
    void 계정을_만들면_기본_프로젝트가_함께_선다() throws Exception {
        mockMvc.perform(get("/api/v1/projects").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].issueCount").value(0));
    }

    @Test
    @DisplayName("프로젝트 이름과 접두어로 생성 시 시스템 고유 식별자를 발급한다")
    void 세우면_식별자로_닿는다() throws Exception {
        String projectId = 프로젝트를_세운다("Gentask Tracker", "GT");

        // 식별자는 사용자가 지정하지 않으며 이름 및 접두어와 무관한 난수형 식별자로 생성한다.
        assertThat(projectId).hasSize(ProjectPublicId.LENGTH).isNotEqualToIgnoringCase("GT");

        mockMvc.perform(get("/api/v1/projects/{projectId}", projectId).cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(projectId))
                .andExpect(jsonPath("$.name").value("Gentask Tracker"))
                .andExpect(jsonPath("$.key").value("GT"));
    }

    @Test
    @DisplayName("접두어가 비어 있거나 형식에 맞지 않으면 예외를 반환한다")
    void 접두어가_모양에_맞지_않으면_알린다() throws Exception {
        세우기를_거절한다("{\"name\":\"빈 접두어\",\"key\":\"   \"}");
        세우기를_거절한다("{\"name\":\"한글 접두어\",\"key\":\"프로젝트\"}");
        세우기를_거절한다("{\"name\":\"너무 긴 접두어\",\"key\":\"ABCDEFGHIJK\"}");
    }

    /*
     * 접두어는 작업 항목 표시 명칭에만 사용하며, 고유 식별은 프로젝트 ID가 담당하므로 접두어 중복을 허용한다.
     */
    @Test
    @DisplayName("접두어가 중복되어도 정상적으로 프로젝트를 생성한다")
    void 접두어가_겹쳐도_그대로_세운다() throws Exception {
        String first = 프로젝트를_세운다("첫째", "GT");
        String second = 프로젝트를_세운다("둘째", "GT");

        assertThat(first).isNotEqualTo(second);
        mockMvc.perform(get("/api/v1/projects/{projectId}", first).cookie(session))
                .andExpect(jsonPath("$.key").value("GT"));
        mockMvc.perform(get("/api/v1/projects/{projectId}", second).cookie(session))
                .andExpect(jsonPath("$.key").value("GT"));
    }

    @Test
    @DisplayName("프로젝트 접두어를 변경해도 기존 작업 항목의 일련번호는 유지된다")
    void 접두어를_바꿔도_번호는_그대로다() throws Exception {
        String projectId = 프로젝트를_세운다("옛 접두어", "TG");
        작업_아이템을_세운다(projectId);

        mockMvc.perform(patch("/api/v1/projects/{projectId}", projectId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"key\":\"GT\"}"))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/projects/{projectId}/issues/{number}", projectId, 1)
                        .cookie(session))
                .andExpect(jsonPath("$.summary.number").value(1))
                .andExpect(jsonPath("$.summary.key").value("GT-1"));
    }

    @Test
    @DisplayName("요청 경로의 프로젝트 식별자 형식이 올바르지 않으면 404를 반환한다")
    void 모양이_아닌_식별자는_없는_것으로_낸다() throws Exception {
        mockMvc.perform(get("/api/v1/projects/{projectId}", "쓸 수 없는 글자").cookie(session))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PROJECT_NOT_FOUND"));
    }

    @Test
    @DisplayName("프로젝트 이름이 공백이면 유효성 검증 오류를 반환한다")
    void 이름이_비어_있으면_알린다() throws Exception {
        세우기를_거절한다("{\"name\":\"   \",\"key\":\"GT\"}");
    }

    @Test
    @DisplayName("프로젝트 목록 조회 시 해당 사용자의 프로젝트만 반환한다")
    void 목록은_그_사용자의_프로젝트만_낸다() throws Exception {
        프로젝트를_세운다("Mine", "MN");

        Cookie other = AuthTestSupport.가입한다(mockMvc, mail, "other-" + UUID.randomUUID() + "@example.com");

        // 기본 프로젝트와 신규 생성 프로젝트를 합산해 2개이며, 타 사용자의 프로젝트는 제외한다.
        mockMvc.perform(get("/api/v1/projects").cookie(session)).andExpect(jsonPath("$", hasSize(2)));
        mockMvc.perform(get("/api/v1/projects").cookie(other)).andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    @DisplayName("타 사용자의 프로젝트에 접근 시 404를 반환한다")
    void 남의_프로젝트는_없는_것으로_낸다() throws Exception {
        String mine = 프로젝트를_세운다("Mine", "MN");

        Cookie other = AuthTestSupport.가입한다(mockMvc, mail, "other-" + UUID.randomUUID() + "@example.com");

        // 식별자가 유일하더라도 소유자가 다른 프로젝트는 404 Not Found로 응답한다.
        mockMvc.perform(get("/api/v1/projects/{projectId}", mine).cookie(other))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PROJECT_NOT_FOUND"));
    }

    @Test
    @DisplayName("인증되지 않은 사용자의 프로젝트 조회를 거부한다")
    void 로그인_없이_프로젝트에_닿을_수_없다() throws Exception {
        mockMvc.perform(get("/api/v1/projects"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    // --- 준비 --------------------------------------------------------------------------------------------------------
    /** Location 헤더의 마지막 세그먼트에서 프로젝트 식별자를 추출한다. */
    private String 프로젝트를_세운다(String name, String key) throws Exception {
        String location = requireNonNull(mockMvc.perform(post("/api/v1/projects")
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"%s\",\"key\":\"%s\"}".formatted(name, key)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location"));
        return location.substring(location.lastIndexOf('/') + 1);
    }

    private void 세우기를_거절한다(String body) throws Exception {
        mockMvc.perform(post("/api/v1/projects")
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    private void 작업_아이템을_세운다(String projectId) throws Exception {
        mockMvc.perform(post("/api/v1/projects/{projectId}/issues", projectId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"번호가 매겨질 것\"}"))
                .andExpect(status().isCreated());
    }
}
