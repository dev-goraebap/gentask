package dev.goraebap.devkit.auth;

import static dev.goraebap.devkit.jooq.Tables.ACCOUNTS;
import static dev.goraebap.devkit.jooq.Tables.SESSIONS;
import static dev.goraebap.devkit.jooq.Tables.USERS;
import static dev.goraebap.devkit.jooq.Tables.VERIFICATIONS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.goraebap.devkit.IntegrationTestSupport;
import dev.goraebap.devkit.mail.MailMessage;
import dev.goraebap.devkit.mail.MailSender;
import jakarta.servlet.http.Cookie;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.ObjectMapper;

/**
 * 복구 흐름과 기기 관리의 전체 경로 검증 (AUTH-06·07·08).
 *
 * <p>코드는 언제나 <b>발송된 메일</b>에서 읽는다 — 클라이언트가 실제로 겪는 경로와 같다.
 */
@AutoConfigureMockMvc
@Import(RecoveryFlowIntegrationTest.RecordingMailConfig.class)
@TestPropertySource(
        properties = {
            "auth.otp.issue-ip-limit=1000",
            "auth.otp.issue-email-limit=1000",
            "auth.otp.confirm-ip-limit=1000",
            "auth.login.ip-limit=1000",
            "auth.login.account-limit=1000"
        })
class RecoveryFlowIntegrationTest extends IntegrationTestSupport {

    private static final Pattern CODE_PATTERN = Pattern.compile("코드: (\\d{6})");
    private static final String ORIGIN = "http://localhost";
    private static final String COOKIE_NAME = "session_token";

    @TestConfiguration
    static class RecordingMailConfig {
        static final List<MailMessage> SENT = new CopyOnWriteArrayList<>();

        @Bean
        @Primary
        MailSender recordingMailSender() {
            return SENT::add;
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private DSLContext dsl;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void 초기화() {
        RecordingMailConfig.SENT.clear();
        dsl.deleteFrom(VERIFICATIONS).execute();
        dsl.deleteFrom(SESSIONS).execute();
        dsl.deleteFrom(ACCOUNTS).execute();
        dsl.deleteFrom(USERS).execute();
    }

    @Test
    @DisplayName("AUTH-07 비밀번호 재설정 전체 흐름 — 새 비밀번호로 로그인되고 기존 세션은 전부 끊긴다")
    void 비밀번호_재설정_전체_흐름() throws Exception {
        Cookie session = 가입한다("reset@example.com", "old-password-1");
        mockMvc.perform(get("/api/v1/sessions/current").cookie(session)).andExpect(status().isOk());

        // 재설정 요청 → 메일에서 코드 확인
        String verificationId = 발급받는다("/api/v1/password-resets", "reset@example.com");
        String code = 마지막_코드();

        mockMvc.perform(post("/api/v1/password-resets/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("verificationId", verificationId, "code", code, "newPassword", "new-password-1")))
                .andExpect(status().isNoContent());

        // 기존 세션은 전부 끊겼다
        assertThat(dsl.fetchCount(SESSIONS)).isZero();
        mockMvc.perform(get("/api/v1/sessions/current").cookie(session)).andExpect(status().isUnauthorized());

        // 옛 비밀번호는 안 되고 새 비밀번호는 된다
        mockMvc.perform(post("/api/v1/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("email", "reset@example.com", "password", "old-password-1")))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("email", "reset@example.com", "password", "new-password-1")))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("AUTH-07 계정이 없어도 응답이 같다 — 존재 여부가 새지 않는다")
    void 계정_유무와_무관하게_같은_응답을_준다() throws Exception {
        가입한다("exists@example.com", "password-1234");
        RecordingMailConfig.SENT.clear();

        MvcResult existing = mockMvc.perform(post("/api/v1/password-resets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("email", "exists@example.com")))
                .andExpect(status().isAccepted())
                .andReturn();
        MvcResult unknown = mockMvc.perform(post("/api/v1/password-resets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("email", "nobody@example.com")))
                .andExpect(status().isAccepted())
                .andReturn();

        // 본문 구조가 같다 (식별자 값만 다르다)
        assertThat(objectMapper
                        .readTree(existing.getResponse().getContentAsString())
                        .propertyNames())
                .isEqualTo(objectMapper
                        .readTree(unknown.getResponse().getContentAsString())
                        .propertyNames());
        // 양쪽 모두 메일이 갔다 — 안 가면 그 자체가 신호가 된다
        assertThat(RecordingMailConfig.SENT).hasSize(2);
        assertThat(RecordingMailConfig.SENT.get(0).subject())
                .as("제목이 같아야 메일함을 훑는 것만으로 구분되지 않는다")
                .isEqualTo(RecordingMailConfig.SENT.get(1).subject());
    }

    @Test
    @DisplayName("AUTH-08 비밀번호 없이 이메일 코드만으로 로그인할 수 있다")
    void 계정_복구_로그인() throws Exception {
        가입한다("recover@example.com", "password-1234");

        String verificationId = 발급받는다("/api/v1/account-recoveries", "recover@example.com");
        MvcResult result = mockMvc.perform(post("/api/v1/account-recoveries/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("verificationId", verificationId, "code", 마지막_코드())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shouldSetPassword").value(false))
                .andReturn();

        Cookie recovered = new Cookie(
                COOKIE_NAME,
                Objects.requireNonNull(result.getResponse().getCookie(COOKIE_NAME))
                        .getValue());
        mockMvc.perform(get("/api/v1/sessions/current").cookie(recovered))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("recover@example.com"));
    }

    @Test
    @DisplayName("AUTH-06 기기 목록을 조회하고 특정 기기만 끊을 수 있다")
    void 기기_목록과_개별_로그아웃() throws Exception {
        Cookie first = 가입한다("devices@example.com", "password-1234");
        Cookie second = 로그인한다("devices@example.com", "password-1234");

        // 두 기기가 보이고, 현재 세션이 표시된다
        MvcResult list = mockMvc.perform(get("/api/v1/sessions").cookie(second))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andReturn();
        var sessions = objectMapper.readTree(list.getResponse().getContentAsString());
        long currentCount = java.util.stream.StreamSupport.stream(sessions.spliterator(), false)
                .filter(node -> node.get("current").asBoolean())
                .count();
        assertThat(currentCount).as("현재 세션은 하나만 표시된다").isEqualTo(1);

        // 다른 기기(first)를 지목해 끊는다
        String firstId = java.util.stream.StreamSupport.stream(sessions.spliterator(), false)
                .filter(node -> !node.get("current").asBoolean())
                .findFirst()
                .orElseThrow()
                .get("id")
                .asString();
        mockMvc.perform(delete("/api/v1/sessions/" + firstId).cookie(second).header("Origin", ORIGIN))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/sessions/current").cookie(first)).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/sessions/current").cookie(second)).andExpect(status().isOk());
    }

    @Test
    @DisplayName("AUTH-06 남의 세션은 끊을 수 없다")
    void 남의_세션은_끊을_수_없다() throws Exception {
        Cookie victim = 가입한다("victim@example.com", "password-1234");
        Cookie attacker = 가입한다("attacker@example.com", "password-1234");

        MvcResult list = mockMvc.perform(get("/api/v1/sessions").cookie(victim))
                .andExpect(status().isOk())
                .andReturn();
        String victimSessionId = objectMapper
                .readTree(list.getResponse().getContentAsString())
                .get(0)
                .get("id")
                .asString();

        mockMvc.perform(delete("/api/v1/sessions/" + victimSessionId)
                        .cookie(attacker)
                        .header("Origin", ORIGIN))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("AUTH_SESSION_NOT_FOUND"));

        mockMvc.perform(get("/api/v1/sessions/current").cookie(victim)).andExpect(status().isOk());
    }

    @Test
    @DisplayName("AUTH-07 다른 용도로 발급된 코드는 통과하지 않는다 (결정-0015)")
    void 용도가_다른_코드는_거부된다() throws Exception {
        가입한다("cross@example.com", "password-1234");

        // 복구용 코드를 받아 비밀번호 재설정에 써본다
        String recoveryId = 발급받는다("/api/v1/account-recoveries", "cross@example.com");
        String recoveryCode = 마지막_코드();

        mockMvc.perform(post("/api/v1/password-resets/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(
                                "verificationId", recoveryId, "code", recoveryCode, "newPassword", "hacked-password")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AUTH_OTP_INVALID"));
    }

    private Cookie 가입한다(String email, String password) throws Exception {
        String verificationId = 발급받는다("/api/v1/email-verifications", email);
        MvcResult result = mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("verificationId", verificationId, "code", 마지막_코드(), "password", password)))
                .andExpect(status().isCreated())
                .andReturn();
        return new Cookie(
                COOKIE_NAME,
                Objects.requireNonNull(result.getResponse().getCookie(COOKIE_NAME))
                        .getValue());
    }

    private Cookie 로그인한다(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("email", email, "password", password)))
                .andExpect(status().isCreated())
                .andReturn();
        return new Cookie(
                COOKIE_NAME,
                Objects.requireNonNull(result.getResponse().getCookie(COOKIE_NAME))
                        .getValue());
    }

    private String 발급받는다(String path, String email) throws Exception {
        MvcResult result = mockMvc.perform(
                        post(path).contentType(MediaType.APPLICATION_JSON).content(json("email", email)))
                .andExpect(status().isAccepted())
                .andReturn();
        return objectMapper
                .readTree(result.getResponse().getContentAsString())
                .get("verificationId")
                .asString();
    }

    private String 마지막_코드() {
        MailMessage last = RecordingMailConfig.SENT.get(RecordingMailConfig.SENT.size() - 1);
        Matcher matcher = CODE_PATTERN.matcher(last.text());
        assertThat(matcher.find()).as("메일 본문에 코드가 있어야 한다").isTrue();
        return matcher.group(1);
    }

    private String json(String... keyValues) {
        StringBuilder builder = new StringBuilder("{");
        for (int i = 0; i < keyValues.length; i += 2) {
            if (i > 0) {
                builder.append(',');
            }
            builder.append('"')
                    .append(keyValues[i])
                    .append("\":\"")
                    .append(keyValues[i + 1])
                    .append('"');
        }
        return builder.append('}').toString();
    }
}
