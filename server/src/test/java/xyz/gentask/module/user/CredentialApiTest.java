package xyz.gentask.module.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import xyz.gentask.AuthTestSupport;
import xyz.gentask.FakeMailConfiguration;
import xyz.gentask.FakeStorageConfiguration;
import xyz.gentask.TestcontainersConfiguration;
import xyz.gentask.shared.mail.E2eMailSupport.RecordingMailSender;

/**
 * 회원가입 이메일 인증, 비밀번호 재설정 및 변경 API를 검증한다.
 *
 * 인증 실패 횟수 갱신 등 독립 트랜잭션 작업과의 교착 상태를 방지하기 위해 테스트 레벨 트랜잭션을 적용하지 않으며, 테스트 격리는 고유 이메일 주소 발급을 통해 보장한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, FakeMailConfiguration.class, FakeStorageConfiguration.class})
class CredentialApiTest {

    private static final String PASSWORD = AuthTestSupport.PASSWORD;
    private static final String NEW_PASSWORD = "brand-new-9!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RecordingMailSender mail;

    // --- 가입 --------------------------------------------------------------------------------------------------------

    @Test
    @DisplayName("회원가입 요청 시 해당 이메일로 인증 코드를 발송한다")
    void 가입을_요청하면_코드가_간다() throws Exception {
        String email = 주소("signup-code");

        mockMvc.perform(가입요청(email, PASSWORD)).andExpect(status().isAccepted());

        assertThat(mail.lastCode(email)).isPresent();
    }

    @Test
    @DisplayName("인증 코드를 확인하기 전에는 계정이 생성되지 않는다")
    void 확인하기_전에는_계정이_생기지_않는다() throws Exception {
        String email = 주소("not-yet");
        mockMvc.perform(가입요청(email, PASSWORD)).andExpect(status().isAccepted());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(본문("email", email, "password", PASSWORD)))
                .andExpect(status().isUnauthorized());

        // 가입 미완료 이메일은 가입 요청을 재시도할 수 있다.
        mockMvc.perform(가입요청(email, PASSWORD)).andExpect(status().isAccepted());
    }

    @Test
    @DisplayName("인증 코드를 재요청하면 기존에 발급된 코드는 만료된다")
    void 다시_요청하면_앞의_코드가_거둬진다() throws Exception {
        String email = 주소("resend");
        mockMvc.perform(가입요청(email, PASSWORD)).andExpect(status().isAccepted());
        String previousCode = AuthTestSupport.받은_코드(mail, email);

        mockMvc.perform(post("/api/v1/auth/signup/resend")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(본문("email", email)))
                .andExpect(status().isAccepted());
        String freshCode = AuthTestSupport.받은_코드(mail, email);
        assertThat(freshCode).isNotEqualTo(previousCode);

        mockMvc.perform(가입확인(email, previousCode)).andExpect(status().isBadRequest());
        mockMvc.perform(가입확인(email, freshCode)).andExpect(status().isCreated());
    }

    @Test
    @DisplayName("인증 코드 입력 실패 횟수가 상한(5회)에 도달하면 해당 코드를 만료 처리한다")
    void 여러_번_틀리면_코드가_거둬진다() throws Exception {
        String email = 주소("exhaust");
        mockMvc.perform(가입요청(email, PASSWORD)).andExpect(status().isAccepted());
        String realCode = AuthTestSupport.받은_코드(mail, email);

        for (int attempt = 0; attempt < 4; attempt++) {
            mockMvc.perform(가입확인(email, "000000")).andExpect(status().isBadRequest());
        }
        // 5회 실패 시 코드가 만료되며 이후 입력은 만료 응답을 반환한다.
        mockMvc.perform(가입확인(email, "000000")).andExpect(status().isGone());

        mockMvc.perform(가입확인(email, realCode)).andExpect(status().isGone());
    }

    // --- 비밀번호 재설정 -------------------------------------------------------------------------------------------------

    @Test
    @DisplayName("가입된 이메일로 비밀번호 재설정 요청 시 인증 코드를 발송한다")
    void 재설정을_요청하면_코드가_간다() throws Exception {
        String email = 주소("reset-code");
        AuthTestSupport.가입한다(mockMvc, mail, email);

        mockMvc.perform(재설정요청(email)).andExpect(status().isAccepted());

        assertThat(mail.lastCode(email)).isPresent();
    }

    @Test
    @DisplayName("비밀번호 재설정 완료 시 해당 계정의 모든 활성 세션과 API 토큰을 만료 처리한다")
    void 재설정하면_세션과_토큰이_거둬진다() throws Exception {
        String email = 주소("revoke-all");
        Cookie session = AuthTestSupport.가입한다(mockMvc, mail, email);
        String token = JsonPathSupport.문자열(
                mockMvc.perform(post("/api/v1/me/api-token").cookie(session))
                        .andExpect(status().isCreated())
                        .andReturn()
                        .getResponse()
                        .getContentAsString(),
                "$.token");

        mockMvc.perform(재설정요청(email)).andExpect(status().isAccepted());
        mockMvc.perform(재설정확인(email, AuthTestSupport.받은_코드(mail, email), NEW_PASSWORD))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/me").cookie(session)).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
        // 변경된 비밀번호로 정상 로그인된다.
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(본문("email", email, "password", NEW_PASSWORD)))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("미가입 이메일로의 재설정 요청도 계정 열거 공격 방지를 위해 동일한 성공 응답을 반환한다")
    void 등록되지_않은_이메일도_같은_응답을_낸다() throws Exception {
        String unknownEmail = 주소("nobody");

        mockMvc.perform(재설정요청(unknownEmail)).andExpect(status().isAccepted());

        assertThat(mail.lastCode(unknownEmail)).isEmpty();
    }

    @Test
    @DisplayName("재설정 코드를 재요청하면 기존에 발급된 재설정 코드는 만료된다")
    void 재설정_코드를_다시_요청하면_앞의_것이_거둬진다() throws Exception {
        String email = 주소("reset-resend");
        AuthTestSupport.가입한다(mockMvc, mail, email);
        mockMvc.perform(재설정요청(email)).andExpect(status().isAccepted());
        String previousCode = AuthTestSupport.받은_코드(mail, email);

        mockMvc.perform(post("/api/v1/auth/password-reset/resend")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(본문("email", email)))
                .andExpect(status().isAccepted());
        String freshCode = AuthTestSupport.받은_코드(mail, email);
        assertThat(freshCode).isNotEqualTo(previousCode);

        mockMvc.perform(재설정확인(email, previousCode, NEW_PASSWORD)).andExpect(status().isBadRequest());
        mockMvc.perform(재설정확인(email, freshCode, NEW_PASSWORD)).andExpect(status().isNoContent());
    }

    // --- 비밀번호 변경 --------------------------------------------------------------------------------------------------

    @Test
    @DisplayName("비밀번호 변경 시 현재 활성 세션을 제외한 다른 모든 세션을 만료 처리한다")
    void 바꾸면_다른_자리의_세션이_거둬진다() throws Exception {
        String email = 주소("change-sessions");
        Cookie firstSeat = AuthTestSupport.가입한다(mockMvc, mail, email);
        Cookie secondSeat = AuthTestSupport.로그인한다(mockMvc, email);

        mockMvc.perform(put("/api/v1/me/password")
                        .cookie(secondSeat)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(본문("currentPassword", PASSWORD, "newPassword", NEW_PASSWORD)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/me").cookie(secondSeat)).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/me").cookie(firstSeat)).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("현재 비밀번호가 불일치하면 CURRENT_PASSWORD_MISMATCH 오류를 반환한다")
    void 현재_비밀번호가_맞지_않으면_바뀌지_않는다() throws Exception {
        String email = 주소("wrong-current");
        Cookie session = AuthTestSupport.가입한다(mockMvc, mail, email);

        mockMvc.perform(put("/api/v1/me/password")
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(본문("currentPassword", "totally-wrong-1!", "newPassword", NEW_PASSWORD)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CURRENT_PASSWORD_MISMATCH"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(본문("email", email, "password", PASSWORD)))
                .andExpect(status().isNoContent());
    }

    // --- 보조 --------------------------------------------------------------------------------------------------------

    private static String 주소(String mark) {
        return mark + "-" + UUID.randomUUID() + "@example.com";
    }

    private static String 본문(String... pairs) {
        StringBuilder json = new StringBuilder("{");
        for (int index = 0; index < pairs.length; index += 2) {
            if (index > 0) {
                json.append(",");
            }
            json.append("\"")
                    .append(pairs[index])
                    .append("\":\"")
                    .append(pairs[index + 1])
                    .append("\"");
        }
        return json.append("}").toString();
    }

    private static org.springframework.test.web.servlet.RequestBuilder 가입요청(String email, String password) {
        return post("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(본문("email", email, "password", password));
    }

    private static org.springframework.test.web.servlet.RequestBuilder 가입확인(String email, String code) {
        return post("/api/v1/auth/signup/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content(본문("email", email, "code", code));
    }

    private static org.springframework.test.web.servlet.RequestBuilder 재설정요청(String email) {
        return post("/api/v1/auth/password-reset")
                .contentType(MediaType.APPLICATION_JSON)
                .content(본문("email", email));
    }

    private static org.springframework.test.web.servlet.RequestBuilder 재설정확인(
            String email, String code, String newPassword) {
        return post("/api/v1/auth/password-reset/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content(본문("email", email, "code", code, "newPassword", newPassword));
    }

    private static final class JsonPathSupport {
        static String 문자열(String json, String path) {
            return com.jayway.jsonpath.JsonPath.read(json, path);
        }
    }
}
