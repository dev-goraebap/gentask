package dev.goraebap.devkit.auth;

import static dev.goraebap.devkit.jooq.Tables.SESSIONS;
import static dev.goraebap.devkit.jooq.Tables.USERS;
import static dev.goraebap.devkit.jooq.Tables.VERIFICATIONS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
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
 * 가입→로그인→로그아웃 전체 흐름 검증 (AUTH-01).
 *
 * <p>OTP 코드는 서비스 내부가 아니라 <b>발송된 메일</b>에서 관찰한다 — 클라이언트가 실제로 겪는
 * 경로와 같다. mail 모듈의 {@link MailSender}를 기록용 가짜로 대체하므로 SMTP 연결은 없다.
 */
@AutoConfigureMockMvc
@Import(AuthFlowIntegrationTest.RecordingMailConfig.class)
@TestPropertySource(
        properties = {
            "auth.otp.issue-ip-limit=1000",
            "auth.otp.issue-email-limit=1000",
            "auth.otp.confirm-ip-limit=1000",
            "auth.login.ip-limit=1000",
            "auth.login.account-limit=1000"
        })
class AuthFlowIntegrationTest extends IntegrationTestSupport {

    private static final Pattern OTP_PATTERN = Pattern.compile("확인 코드: (\\d{6})");
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
        dsl.deleteFrom(dev.goraebap.devkit.jooq.Tables.ACCOUNTS).execute();
        dsl.deleteFrom(USERS).execute();
    }

    @Test
    @DisplayName("AUTH-01 가입 전체 흐름 — OTP 발급·검증·쿠키 세션·로그아웃 즉시 무효화")
    void 가입_로그인_로그아웃_전체_흐름() throws Exception {
        // 1. OTP 발급 — 이 단계에서 user는 없다
        String verificationId = issueVerification("Flow@Example.com");
        assertThat(dsl.fetchCount(USERS)).isZero();

        // 2. 발송된 메일에서 코드를 읽는다
        String code = lastOtpCode();

        // 3. 가입 완료 — 쿠키가 내려오고 토큰은 본문에 없다
        MvcResult signup = mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("verificationId", verificationId, "code", code, "password", "password-1234")))
                .andExpect(status().isCreated())
                .andExpect(cookie().exists(COOKIE_NAME))
                .andExpect(cookie().httpOnly(COOKIE_NAME, true))
                .andExpect(jsonPath("$.token").doesNotExist())
                // 사용자가 입력한 원문이 보존된다 — 유일성 판정만 정규화된 값으로 한다 (결정-0015 §결정 5)
                .andExpect(jsonPath("$.email").value("Flow@Example.com"))
                .andReturn();
        assertThat(dsl.fetchCount(USERS)).isEqualTo(1);

        Cookie session = new Cookie(
                COOKIE_NAME,
                Objects.requireNonNull(signup.getResponse().getCookie(COOKIE_NAME))
                        .getValue());

        // 4. 쿠키로 현재 세션 조회
        mockMvc.perform(get("/api/v1/sessions/current").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("Flow@Example.com"));

        // 5. 로그아웃 — 상태 변경이므로 Origin 검증을 통과해야 한다
        mockMvc.perform(delete("/api/v1/sessions/current").cookie(session).header("Origin", ORIGIN))
                .andExpect(status().isNoContent());

        // 6. 같은 쿠키는 즉시 무효 — 행 삭제라 유예가 없다
        mockMvc.perform(get("/api/v1/sessions/current").cookie(session))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_UNAUTHENTICATED"));
        assertThat(dsl.fetchCount(SESSIONS)).isZero();
    }

    @Test
    @DisplayName("AUTH-01 OTP를 통과하지 못하면 user 행이 생기지 않는다 — 5회 실패 시 폐기")
    void 검증_실패는_사용자를_만들지_않는다() throws Exception {
        String verificationId = issueVerification("fail@example.com");
        String code = lastOtpCode();
        String wrongCode = code.equals("000000") ? "000001" : "000000";

        for (int i = 0; i < 4; i++) {
            mockMvc.perform(post("/api/v1/users")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json(
                                    "verificationId", verificationId, "code", wrongCode, "password", "password-1234")))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("AUTH_OTP_INVALID"));
        }
        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(
                                json("verificationId", verificationId, "code", wrongCode, "password", "password-1234")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AUTH_OTP_ATTEMPTS_EXCEEDED"));

        // 폐기 후에는 올바른 코드도 거부된다
        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("verificationId", verificationId, "code", code, "password", "password-1234")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AUTH_OTP_ATTEMPTS_EXCEEDED"));

        assertThat(dsl.fetchCount(USERS)).isZero();
    }

    @Test
    @DisplayName("AUTH-06 Bearer 전달 — 모바일·외부 클라이언트 경로 (결정-0014)")
    void bearer_전달로도_같은_세션을_쓴다() throws Exception {
        String verificationId = issueVerification("bearer@example.com");
        String code = lastOtpCode();

        MvcResult signup = mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(
                                "verificationId",
                                verificationId,
                                "code",
                                code,
                                "password",
                                "password-1234",
                                "transport",
                                "BEARER")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();
        String token = objectMapper
                .readTree(signup.getResponse().getContentAsString())
                .get("token")
                .asString();

        // Bearer는 Origin 검증 대상이 아니다 — 공격 페이지는 헤더에 토큰을 실을 수 없다
        mockMvc.perform(get("/api/v1/sessions/current").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("bearer@example.com"));
        mockMvc.perform(delete("/api/v1/sessions/current").header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/sessions/current").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("AUTH-01 로그인·로그인 실패 — 실패 응답이 이메일 없음과 비밀번호 틀림을 구분하지 않는다")
    void 로그인과_실패_응답() throws Exception {
        signupUser("login@example.com", "password-1234");

        mockMvc.perform(post("/api/v1/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("email", "login@example.com", "password", "password-1234")))
                .andExpect(status().isCreated())
                .andExpect(cookie().exists(COOKIE_NAME))
                .andExpect(jsonPath("$.token").doesNotExist());

        MvcResult wrongPassword = mockMvc.perform(post("/api/v1/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("email", "login@example.com", "password", "wrong-password")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_INVALID_CREDENTIALS"))
                .andReturn();
        MvcResult unknownEmail = mockMvc.perform(post("/api/v1/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("email", "nobody@example.com", "password", "wrong-password")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_INVALID_CREDENTIALS"))
                .andReturn();
        // traceId는 요청마다 다르므로 제외하고 본문이 완전히 같아야 한다
        assertThat(withoutTraceId(wrongPassword)).isEqualTo(withoutTraceId(unknownEmail));
    }

    private String withoutTraceId(MvcResult result) throws Exception {
        var body = (tools.jackson.databind.node.ObjectNode)
                objectMapper.readTree(result.getResponse().getContentAsString());
        body.remove("traceId");
        return body.toString();
    }

    @Test
    @DisplayName("AUTH-05 기존 계정의 이메일로 발급을 요청하면 안내 메일이 가고 응답 형태는 동일하다")
    void 기존_이메일_발급은_안내_메일이_가고_응답은_같다() throws Exception {
        signupUser("dup@example.com", "password-1234");
        RecordingMailConfig.SENT.clear();

        mockMvc.perform(post("/api/v1/email-verifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("email", "dup@example.com")))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.verificationId").isNotEmpty());

        assertThat(RecordingMailConfig.SENT).hasSize(1);
        assertThat(RecordingMailConfig.SENT.get(0).text()).doesNotContainPattern("\\d{6}");
    }

    @Test
    @DisplayName("AUTH-06 쿠키가 실린 상태 변경 요청은 Origin 검증을 통과해야 한다 — CSRF 방어 (결정-0014)")
    void 쿠키_상태변경_요청은_origin이_필요하다() throws Exception {
        Cookie session = signupUser("csrf@example.com", "password-1234");

        // Origin 없음 → 거부
        mockMvc.perform(delete("/api/v1/sessions/current").cookie(session))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("AUTH_FORBIDDEN_ORIGIN"));

        // 다른 출처 → 거부
        mockMvc.perform(delete("/api/v1/sessions/current").cookie(session).header("Origin", "https://evil.example"))
                .andExpect(status().isForbidden());

        // 세션은 여전히 유효하다
        mockMvc.perform(get("/api/v1/sessions/current").cookie(session)).andExpect(status().isOk());
    }

    @Test
    @DisplayName("AUTH-06 인증 없는 보호 리소스 접근은 401이다 — 기본 거부")
    void 인증_없는_접근은_거부된다() throws Exception {
        mockMvc.perform(get("/api/v1/sessions/current"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_UNAUTHENTICATED"));
    }

    private String issueVerification(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/email-verifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("email", email)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.verificationId").isNotEmpty())
                .andReturn();
        return objectMapper
                .readTree(result.getResponse().getContentAsString())
                .get("verificationId")
                .asString();
    }

    private String lastOtpCode() {
        MailMessage last = RecordingMailConfig.SENT.get(RecordingMailConfig.SENT.size() - 1);
        Matcher matcher = OTP_PATTERN.matcher(last.text());
        assertThat(matcher.find()).as("메일 본문에 OTP 코드가 있어야 한다").isTrue();
        return matcher.group(1);
    }

    private Cookie signupUser(String email, String password) throws Exception {
        String verificationId = issueVerification(email);
        String code = lastOtpCode();
        MvcResult result = mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("verificationId", verificationId, "code", code, "password", password)))
                .andExpect(status().isCreated())
                .andReturn();
        return new Cookie(
                COOKIE_NAME,
                Objects.requireNonNull(result.getResponse().getCookie(COOKIE_NAME))
                        .getValue());
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
