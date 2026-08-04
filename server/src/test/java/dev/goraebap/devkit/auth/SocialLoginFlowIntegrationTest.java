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
import dev.goraebap.devkit.auth.application.sociallogin.SocialTicketCookieFactory;
import dev.goraebap.devkit.mail.MailMessage;
import dev.goraebap.devkit.mail.MailSender;
import jakarta.servlet.http.Cookie;
import java.util.List;
import java.util.Map;
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
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.ObjectMapper;

/**
 * 소셜 로그인 2단계 전체 흐름 (AUTH-02·03·05).
 *
 * <p><b>이 파일이 존재하는 이유</b>: 보안 검토가 {@code SocialLoginSuccessHandler}와
 * {@code SocialLoginController}에 <b>테스트가 한 줄도 닿지 않는다</b>고 지적했다. 검토가 찾은
 * 결함 F1·F3·F4가 전부 그 두 파일에 있었다. 고치기만 하고 테스트를 두지 않으면 같은 결함이
 * 다시 들어올 때 아무도 모른다.
 *
 * <p>제공자를 실제로 부르지 않는다. Spring Security가 인가 코드 교환과 사용자 정보 조회를 마친
 * 상태를 {@link OAuth2AuthenticationToken}으로 만들어 <b>성공 핸들러를 직접 호출</b>한다 —
 * 핸들러 입장에서는 실제 콜백과 같은 입력이다.
 */
@AutoConfigureMockMvc
@Import(SocialLoginFlowIntegrationTest.RecordingMailConfig.class)
@TestPropertySource(
        properties = {
            "auth.otp.issue-ip-limit=1000",
            "auth.otp.issue-email-limit=1000",
            "auth.otp.confirm-ip-limit=1000"
        })
class SocialLoginFlowIntegrationTest extends IntegrationTestSupport {

    private static final Pattern OTP_PATTERN = Pattern.compile("확인 코드: (\\d{6})");
    private static final String GOOGLE_SUBJECT = "google-sub-12345";
    private static final String REDIRECT_BASE = "http://localhost:4200";
    private static final String TICKET_COOKIE = SocialTicketCookieFactory.COOKIE_NAME;
    private static final String SESSION_COOKIE = "session_token";

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
    private AuthenticationSuccessHandler socialLoginSuccessHandler;

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

    // ── F1: 표는 URL이 아니라 쿠키로 간다 ──────────────────────────────

    @Test
    @DisplayName("AUTH-02 처음 보는 신원이면 표를 쿠키로 심고 리다이렉트 URL에는 남기지 않는다")
    void 표는_URL이_아니라_쿠키로_간다() throws Exception {
        MockHttpServletResponse response = 제공자_인증_성공(AuthProviderFixture.GOOGLE, GOOGLE_SUBJECT);

        // 표가 쿼리스트링에 실리면 액세스 로그·Location 헤더·브라우저 히스토리에 남고,
        // 그것을 주운 사람이 자기 이메일로 소유 증명을 통과해 남의 제공자 신원을 선점할 수 있다
        assertThat(response.getRedirectedUrl()).as("표가 URL에 실리지 않는다").isEqualTo(REDIRECT_BASE + "/auth/social/email");
        assertThat(response.getRedirectedUrl()).doesNotContain("ticket");

        String setCookie = 표_쿠키_헤더(response);
        assertThat(setCookie).as("스크립트가 읽지 못한다").contains("HttpOnly");
        assertThat(setCookie).as("남의 사이트발 POST에 실리지 않는다").contains("SameSite=Lax");
        assertThat(setCookie).as("소셜 로그인 경로 밖으로 새 나가지 않는다").contains("Path=/api/v1/social-logins");
        assertThat(response.getCookie(TICKET_COOKIE)).isNotNull();
    }

    @Test
    @DisplayName("AUTH-02 표 쿠키가 없으면 이메일 단계가 거부된다")
    void 표_없이는_이메일_단계를_지날_수_없다() throws Exception {
        mockMvc.perform(post("/api/v1/social-logins/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("email", "nobody@example.com")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AUTH_SOCIAL_TICKET_INVALID"));

        assertThat(RecordingMailConfig.SENT).as("표가 없으면 코드도 보내지 않는다").isEmpty();
    }

    @Test
    @DisplayName("AUTH-02 표는 한 번 쓰면 쿠키에서 지워진다")
    void 표는_한_번_쓰면_사라진다() throws Exception {
        String ticket = 표를_받는다();

        mockMvc.perform(post("/api/v1/social-logins/email")
                        .cookie(new Cookie(TICKET_COOKIE, ticket))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("email", "first@example.com")))
                .andExpect(status().isAccepted())
                // Max-Age=0 — 브라우저가 즉시 지운다. 같은 표로 대기 레코드를 여러 개 만드는 경로가 닫힌다
                .andExpect(cookie().maxAge(TICKET_COOKIE, 0));
    }

    // ── F7: 미지의 제공자 ────────────────────────────────────────────

    @Test
    @DisplayName("AUTH-02 등록에 없는 제공자로 들어오면 에러 화면으로 보낸다")
    void 미지의_제공자는_에러_화면으로_간다() throws Exception {
        // 파생 프로젝트가 제공자 등록만 추가하고 enum 상수를 빠뜨린 상황.
        // 이 지점은 @RestControllerAdvice 밖이라 그냥 두면 컨테이너 기본 에러 페이지가 나온다
        MockHttpServletResponse response = 제공자_인증_성공("apple", "apple-sub-1");

        assertThat(response.getRedirectedUrl()).isEqualTo(REDIRECT_BASE + "/auth/error?reason=unsupported");
        assertThat(response.getCookie(TICKET_COOKIE)).as("표를 발급하지 않는다").isNull();
    }

    // ── 2단계 전체 흐름 ──────────────────────────────────────────────

    @Test
    @DisplayName("AUTH-02·03 처음 보는 신원의 2단계 — 쿠키 표 → 이메일 → 코드 → 계정 생성")
    void 처음_보는_신원의_2단계_전체_흐름() throws Exception {
        String ticket = 표를_받는다();
        assertThat(dsl.fetchCount(USERS)).as("이 시점에는 아무것도 저장되지 않았다").isZero();

        String verificationId = mockMvc.perform(post("/api/v1/social-logins/email")
                        .cookie(new Cookie(TICKET_COOKIE, ticket))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("email", "New@Example.com")))
                .andExpect(status().isAccepted())
                .andReturn()
                .getResponse()
                .getContentAsString()
                .replaceAll(".*\"verificationId\"\\s*:\\s*\"([^\"]+)\".*", "$1");

        assertThat(dsl.fetchCount(USERS)).as("코드 발송 단계에서도 user는 없다").isZero();

        mockMvc.perform(post("/api/v1/social-logins/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("verificationId", verificationId, "code", 마지막_코드())))
                .andExpect(status().isOk())
                .andExpect(cookie().exists(SESSION_COOKIE))
                .andExpect(cookie().httpOnly(SESSION_COOKIE, true))
                .andExpect(jsonPath("$.status").value("SIGNED_IN"))
                .andExpect(jsonPath("$.session.token").doesNotExist());

        assertThat(dsl.fetchCount(USERS)).isOne();
        assertThat(dsl.selectFrom(ACCOUNTS).fetchSingle().getProvider()).isEqualTo("google");
        assertThat(dsl.selectFrom(USERS).fetchSingle().getEmail())
                .as("사용자가 입력한 원문이 보존된다")
                .isEqualTo("New@Example.com");
    }

    @Test
    @DisplayName("AUTH-02 이미 아는 신원이면 2단계 없이 세션 쿠키를 받는다")
    void 아는_신원은_바로_로그인된다() throws Exception {
        처음_보는_신원의_2단계_전체_흐름();
        RecordingMailConfig.SENT.clear();

        MockHttpServletResponse response = 제공자_인증_성공(AuthProviderFixture.GOOGLE, GOOGLE_SUBJECT);

        assertThat(response.getRedirectedUrl()).isEqualTo(REDIRECT_BASE + "/auth/complete");
        assertThat(response.getCookie(SESSION_COOKIE)).isNotNull();
        assertThat(response.getCookie(TICKET_COOKIE)).as("표가 필요 없다").isNull();
        assertThat(RecordingMailConfig.SENT).as("메일을 보내지 않는다").isEmpty();
    }

    // ── F4: 같은 신원으로 두 번 완료할 수 없다 ────────────────────────

    @Test
    @DisplayName("AUTH-02 같은 제공자 신원으로 두 번째 완료를 시도하면 제약 위반이 아니라 업무 오류로 거부된다")
    void 같은_신원으로_두_번_완료할_수_없다() throws Exception {
        // 표 하나로 대기 레코드를 둘 만든 뒤(쿠키를 직접 들고 두 번 호출) 둘 다 통과시키려 한다
        String ticket = 표를_받는다();
        String first = 이메일_단계(ticket, "one@example.com");
        String firstCode = 마지막_코드();
        String second = 이메일_단계(ticket, "two@example.com");
        String secondCode = 마지막_코드();

        mockMvc.perform(post("/api/v1/social-logins/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("verificationId", first, "code", firstCode)))
                .andExpect(status().isOk());

        // 두 번째 — 재확인이 없으면 user 삽입까지 성공한 뒤 accounts 유니크 제약에 걸려 500이 된다
        mockMvc.perform(post("/api/v1/social-logins/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("verificationId", second, "code", secondCode)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AUTH_SOCIAL_TICKET_INVALID"));

        assertThat(dsl.fetchCount(USERS)).as("두 번째 사용자가 남지 않는다").isOne();
        assertThat(dsl.fetchCount(ACCOUNTS)).isOne();
    }

    // ── 도우미 ──────────────────────────────────────────────────────

    /** enum에 있는 값과 없는 값을 함께 쓰기 위해 문자열로 다룬다. */
    private static final class AuthProviderFixture {
        private static final String GOOGLE = "google";

        private AuthProviderFixture() {}
    }

    private MockHttpServletResponse 제공자_인증_성공(String registrationId, String subject) throws Exception {
        OAuth2User principal =
                new DefaultOAuth2User(List.of(new SimpleGrantedAuthority("ROLE_USER")), Map.of("sub", subject), "sub");
        OAuth2AuthenticationToken token =
                new OAuth2AuthenticationToken(principal, principal.getAuthorities(), registrationId);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.10");
        MockHttpServletResponse response = new MockHttpServletResponse();
        socialLoginSuccessHandler.onAuthenticationSuccess(request, response, token);
        return response;
    }

    private String 표를_받는다() throws Exception {
        MockHttpServletResponse response = 제공자_인증_성공(AuthProviderFixture.GOOGLE, GOOGLE_SUBJECT);
        Cookie cookie = response.getCookie(TICKET_COOKIE);
        assertThat(cookie).as("표 쿠키가 심어져야 한다").isNotNull();
        return Objects.requireNonNull(cookie).getValue();
    }

    private String 이메일_단계(String ticket, String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/social-logins/email")
                        .cookie(new Cookie(TICKET_COOKIE, ticket))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("email", email)))
                .andExpect(status().isAccepted())
                .andReturn();
        return result.getResponse()
                .getContentAsString()
                .replaceAll(".*\"verificationId\"\\s*:\\s*\"([^\"]+)\".*", "$1");
    }

    private String 표_쿠키_헤더(MockHttpServletResponse response) {
        return response.getHeaders(HttpHeaders.SET_COOKIE).stream()
                .filter(header -> header.startsWith(TICKET_COOKIE + "="))
                .findFirst()
                .orElseThrow(() -> new AssertionError("표 쿠키가 없다"));
    }

    private String 마지막_코드() {
        for (int i = RecordingMailConfig.SENT.size() - 1; i >= 0; i--) {
            Matcher matcher =
                    OTP_PATTERN.matcher(RecordingMailConfig.SENT.get(i).text());
            if (matcher.find()) {
                return matcher.group(1);
            }
        }
        throw new AssertionError("발송된 메일에 코드가 없다");
    }

    private String json(String... keyValues) {
        return objectMapper.writeValueAsString(pairs(keyValues));
    }

    private static Map<String, String> pairs(String... keyValues) {
        return switch (keyValues.length) {
            case 2 -> Map.of(keyValues[0], keyValues[1]);
            case 4 -> Map.of(keyValues[0], keyValues[1], keyValues[2], keyValues[3]);
            default -> throw new IllegalArgumentException("키-값 쌍이 맞지 않는다");
        };
    }
}
