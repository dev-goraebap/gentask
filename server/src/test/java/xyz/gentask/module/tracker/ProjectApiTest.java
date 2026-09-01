package xyz.gentask.module.tracker;

import static java.util.Objects.requireNonNull;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
    @DisplayName("TG-042 #3: 계정을 만들면 기본 프로젝트가 함께 선다")
    void 계정을_만들면_기본_프로젝트가_함께_선다() throws Exception {
        mockMvc.perform(get("/api/v1/projects").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].issueCount").value(0));
    }

    @Test
    @DisplayName("TG-042 #1: 이름을 적어 세우면 그 이름에서 뽑은 접두어와 함께 선다")
    void 이름을_적어_세우면_접두어와_함께_선다() throws Exception {
        String key = 프로젝트를_세운다("Gentask Tracker");

        mockMvc.perform(get("/api/v1/projects/{key}", key).cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Gentask Tracker"))
                .andExpect(jsonPath("$.key").value("GE"));
    }

    @Test
    @DisplayName("TG-042 #2: 접두어가 이미 쓰이고 있으면 겹치지 않는 것을 붙인다")
    void 접두어가_겹치면_겹치지_않는_것을_붙인다() throws Exception {
        String first = 프로젝트를_세운다("Gentask");
        String second = 프로젝트를_세운다("Gentask 둘");
        String third = 프로젝트를_세운다("Gentask 셋");

        mockMvc.perform(get("/api/v1/projects/{key}", first).cookie(session))
                .andExpect(jsonPath("$.key").value("GE"));
        mockMvc.perform(get("/api/v1/projects/{key}", second).cookie(session))
                .andExpect(jsonPath("$.key").value("GE2"));
        mockMvc.perform(get("/api/v1/projects/{key}", third).cookie(session))
                .andExpect(jsonPath("$.key").value("GE3"));
    }

    /*
     * 접두어가 주소에 그대로 들어가므로 영문과 숫자만 담는다. 한글로만 지은 이름은 남는 것이 없어
     * P 를 받고, 겹치면 P2 로 이어진다. 이름과 이어지지 않는 것이 그 대가다.
     */
    @Test
    @DisplayName("TG-042 #7: 이름에 영문과 숫자가 없으면 영문 접두어를 대신 붙인다")
    void 한글_이름은_영문_접두어를_받는다() throws Exception {
        // 가입 때 선 기본 프로젝트가 이미 P 를 갖고 있다. 그 뒤로 이어진다.
        assertThat(프로젝트를_세운다("내 프로젝트")).isEqualTo("P2");
        assertThat(프로젝트를_세운다("우리 프로젝트")).isEqualTo("P3");
    }

    @Test
    @DisplayName("접두어는 사용자 안에서만 유일하다")
    void 접두어는_사용자_안에서만_유일하다() throws Exception {
        String mine = 프로젝트를_세운다("Gentask");

        Cookie other = AuthTestSupport.가입한다(mockMvc, mail, "other-" + UUID.randomUUID() + "@example.com");
        String theirs = 프로젝트를_세운다(other, "Gentask");

        mockMvc.perform(get("/api/v1/projects/{key}", mine).cookie(session))
                .andExpect(jsonPath("$.key").value("GE"));
        mockMvc.perform(get("/api/v1/projects/{key}", theirs).cookie(other))
                .andExpect(jsonPath("$.key").value("GE"));
    }

    @Test
    @DisplayName("TG-042 #4: 이름이 비어 있으면 이름이 필요함을 알린다")
    void 이름이_비어_있으면_알린다() throws Exception {
        mockMvc.perform(post("/api/v1/projects")
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"   \"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TG-042 #5: 목록을 열면 그 사용자의 프로젝트만 온다")
    void 목록은_그_사용자의_프로젝트만_낸다() throws Exception {
        프로젝트를_세운다("Mine");

        Cookie other = AuthTestSupport.가입한다(mockMvc, mail, "other-" + UUID.randomUUID() + "@example.com");

        // 기본 프로젝트 하나에 방금 세운 것을 더해 둘이다. 남의 것은 세지 않는다.
        mockMvc.perform(get("/api/v1/projects").cookie(session)).andExpect(jsonPath("$", hasSize(2)));
        mockMvc.perform(get("/api/v1/projects").cookie(other)).andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    @DisplayName("TG-042 #6: 사용자의 것이 아닌 프로젝트는 없는 것으로 낸다")
    void 남의_프로젝트는_없는_것으로_낸다() throws Exception {
        String mine = 프로젝트를_세운다("Mine");

        Cookie other = AuthTestSupport.가입한다(mockMvc, mail, "other-" + UUID.randomUUID() + "@example.com");

        mockMvc.perform(get("/api/v1/projects/{key}", mine).cookie(other))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PROJECT_NOT_FOUND"));
    }

    @Test
    @DisplayName("로그인 없이 프로젝트에 닿을 수 없다")
    void 로그인_없이_프로젝트에_닿을_수_없다() throws Exception {
        mockMvc.perform(get("/api/v1/projects"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    // --- 준비 --------------------------------------------------------------------------------------------------------
    /** Location 의 마지막 마디가 접두어다. 주소가 UUID 가 아니라 그것을 갖는다. */
    private String 프로젝트를_세운다(String name) throws Exception {
        return 프로젝트를_세운다(session, name);
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
