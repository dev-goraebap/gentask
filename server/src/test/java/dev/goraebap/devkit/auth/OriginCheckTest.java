package dev.goraebap.devkit.auth;

import static dev.goraebap.devkit.jooq.Tables.ACCOUNTS;
import static dev.goraebap.devkit.jooq.Tables.SESSIONS;
import static dev.goraebap.devkit.jooq.Tables.USERS;
import static dev.goraebap.devkit.jooq.Tables.VERIFICATIONS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.goraebap.devkit.IntegrationTestSupport;
import dev.goraebap.devkit.auth.application.registration.RegistrationService;
import dev.goraebap.devkit.auth.application.shared.ClientInfo;
import dev.goraebap.devkit.mail.MailMessage;
import dev.goraebap.devkit.mail.MailSender;
import java.util.List;
import java.util.UUID;
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
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

/**
 * 상태를 바꾸는 요청의 출처 검증 (검토 #32-2).
 *
 * <p><b>막으려는 것은 세션 고정(session fixation)이다.</b> 로그인하지 않은 피해자가 공격 페이지를
 * 열면, 공격자 계정의 {@code verificationId}+{@code code}로 교차 출처 POST가 나가고 그 응답의
 * {@code Set-Cookie}가 <b>공격자 세션을 피해자 브라우저에 심는다.</b> 이후 피해자는 자기 계정인 줄
 * 알고 공격자 계정에 데이터를 입력한다.
 *
 * <p>옛 필터는 <b>세션 쿠키가 실려 있을 때만</b> 출처를 봤다. 이 공격은 요청 시점에 쿠키가 없으므로
 * 그 조건에 걸리지 않았다.
 */
@AutoConfigureMockMvc
@Import(OriginCheckTest.RecordingMailConfig.class)
@TestPropertySource(
        properties = {
            "auth.otp.issue-ip-limit=1000",
            "auth.otp.issue-email-limit=1000",
            "auth.otp.confirm-ip-limit=1000",
            "auth.login.ip-limit=1000",
            "auth.login.account-limit=1000"
        })
class OriginCheckTest extends IntegrationTestSupport {

    private static final Pattern OTP_PATTERN = Pattern.compile("확인 코드: (\\d{6})");
    private static final String SAME_ORIGIN = "http://localhost";
    private static final String ATTACKER_ORIGIN = "https://evil.example.com";

    @TestConfiguration
    @Profile("test")
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
    private RegistrationService registrationService;

    @Autowired
    private DSLContext dsl;

    @BeforeEach
    void 초기화() {
        RecordingMailConfig.SENT.clear();
        dsl.deleteFrom(VERIFICATIONS).execute();
        dsl.deleteFrom(SESSIONS).execute();
        dsl.deleteFrom(ACCOUNTS).execute();
        dsl.deleteFrom(USERS).execute();
    }

    @Test
    @DisplayName("AUTH-01 로그인하지 않은 상태의 교차 출처 가입 완료가 거부된다 — 세션 고정 차단")
    void 미인증_교차출처_요청이_거부된다() throws Exception {
        UUID verificationId = registrationService.issueSignupVerification("victim@example.com", "203.0.113.10");
        String code = 마지막_코드();

        mockMvc.perform(post("/api/v1/users")
                        .header("Origin", ATTACKER_ORIGIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(가입본문(verificationId, code)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("AUTH_FORBIDDEN_ORIGIN"))
                .andExpect(cookie().doesNotExist("session_token"));

        assertThat(dsl.fetchCount(USERS)).as("계정이 생기지 않는다").isZero();
    }

    @Test
    @DisplayName("AUTH-01 교차 출처 로그인도 거부된다 — 쿠키가 없어도 본다")
    void 미인증_교차출처_로그인이_거부된다() throws Exception {
        가입한다("member@example.com");

        mockMvc.perform(post("/api/v1/sessions")
                        .header("Origin", ATTACKER_ORIGIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"member@example.com\",\"password\":\"password-1234\"}"))
                .andExpect(status().isForbidden())
                .andExpect(cookie().doesNotExist("session_token"));
    }

    @Test
    @DisplayName("AUTH-01 같은 출처의 요청은 그대로 통과한다")
    void 동일_출처_요청은_통과한다() throws Exception {
        UUID verificationId = registrationService.issueSignupVerification("same@example.com", "203.0.113.10");
        String code = 마지막_코드();

        mockMvc.perform(post("/api/v1/users")
                        .header("Origin", SAME_ORIGIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(가입본문(verificationId, code)))
                .andExpect(status().isCreated())
                .andExpect(cookie().exists("session_token"));
    }

    @Test
    @DisplayName("AUTH-01 Origin이 없는 비브라우저 클라이언트는 통과한다 — 쿠키가 없으면 고정될 것도 없다")
    void 헤더가_없는_클라이언트는_통과한다() throws Exception {
        UUID verificationId = registrationService.issueSignupVerification("mobile@example.com", "203.0.113.10");
        String code = 마지막_코드();

        // 모바일·서버 클라이언트는 Origin을 보내지 않는다. 브라우저는 POST에 항상 보내므로,
        // 공격자가 피해자 브라우저에서 이 헤더를 지울 수는 없다 — 그것이 이 예외의 근거다.
        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(가입본문(verificationId, code)))
                .andExpect(status().isCreated());
    }

    private void 가입한다(String email) {
        UUID verificationId = registrationService.issueSignupVerification(email, "203.0.113.10");
        registrationService.completeSignup(
                verificationId, 마지막_코드(), "password-1234", ClientInfo.of("203.0.113.10", "test"));
        RecordingMailConfig.SENT.clear();
    }

    private String 가입본문(UUID verificationId, String code) {
        return "{\"verificationId\":\"" + verificationId + "\",\"code\":\"" + code
                + "\",\"password\":\"password-1234\"}";
    }

    /**
     * 메일은 <b>커밋 이후 비동기로</b> 나간다(결정-0016). 발송을 기다리지 않고 바로 읽으면
     * 아직 도착하지 않아 간헐적으로 실패한다 — 도착할 때까지 짧게 기다린다.
     */
    private String 마지막_코드() {
        long deadline = System.nanoTime() + java.util.concurrent.TimeUnit.SECONDS.toNanos(5);
        while (System.nanoTime() < deadline) {
            for (int i = RecordingMailConfig.SENT.size() - 1; i >= 0; i--) {
                Matcher matcher =
                        OTP_PATTERN.matcher(RecordingMailConfig.SENT.get(i).text());
                if (matcher.find()) {
                    return matcher.group(1);
                }
            }
            try {
                Thread.sleep(20);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new AssertionError("코드를 기다리다 중단됐다", e);
            }
        }
        throw new AssertionError("발송된 메일에 코드가 없다");
    }
}
