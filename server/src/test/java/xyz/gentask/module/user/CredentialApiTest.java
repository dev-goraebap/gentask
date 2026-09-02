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
 * 가입의 이메일 확인과 비밀번호 재설정 · 변경.
 *
 * <p>트랜잭션을 두지 않는다. 틀린 횟수를 올리는 자리가 별도 트랜잭션이라, 시험이 한 트랜잭션을
 * 붙들고 있으면 아직 커밋되지 않은 행을 그쪽이 만나 서로 기다린다. 대신 시험마다 다른 주소를 쓴다.
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
    @DisplayName("GT-38 #1: 가입을 요청하면 그 주소로 코드가 간다")
    void 가입을_요청하면_코드가_간다() throws Exception {
        String email = 주소("signup-code");

        mockMvc.perform(가입요청(email, PASSWORD)).andExpect(status().isAccepted());

        assertThat(mail.lastCode(email)).isPresent();
    }

    @Test
    @DisplayName("GT-38 #3: 코드를 확인하기 전에는 그 이메일로 계정이 생기지 않는다")
    void 확인하기_전에는_계정이_생기지_않는다() throws Exception {
        String email = 주소("not-yet");
        mockMvc.perform(가입요청(email, PASSWORD)).andExpect(status().isAccepted());

        // 계정이 생겼다면 그 자격으로 로그인할 수 있어야 한다
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(본문("email", email, "password", PASSWORD)))
                .andExpect(status().isUnauthorized());

        // 그 주소는 아직 쓰이지 않았으므로 다른 사람이 그대로 가입을 시작할 수 있다
        mockMvc.perform(가입요청(email, PASSWORD)).andExpect(status().isAccepted());
    }

    @Test
    @DisplayName("GT-38 #7: 코드를 다시 요청하면 앞서 보낸 것이 더 이상 통하지 않는다")
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
    @DisplayName("GT-38 #8: 정해진 횟수보다 많이 틀리면 그 코드가 거둬진다")
    void 여러_번_틀리면_코드가_거둬진다() throws Exception {
        String email = 주소("exhaust");
        mockMvc.perform(가입요청(email, PASSWORD)).andExpect(status().isAccepted());
        String realCode = AuthTestSupport.받은_코드(mail, email);

        for (int attempt = 0; attempt < 4; attempt++) {
            mockMvc.perform(가입확인(email, "000000")).andExpect(status().isBadRequest());
        }
        // 다섯 번째가 한도를 채운다. 거둔 코드는 만료된 것과 같은 응답을 낸다.
        mockMvc.perform(가입확인(email, "000000")).andExpect(status().isGone());

        mockMvc.perform(가입확인(email, realCode)).andExpect(status().isGone());
    }

    // --- 비밀번호 재설정 -------------------------------------------------------------------------------------------------

    @Test
    @DisplayName("GT-39 #1: 가입한 이메일로 재설정을 요청하면 그 주소로 코드가 간다")
    void 재설정을_요청하면_코드가_간다() throws Exception {
        String email = 주소("reset-code");
        AuthTestSupport.가입한다(mockMvc, mail, email);

        mockMvc.perform(재설정요청(email)).andExpect(status().isAccepted());

        assertThat(mail.lastCode(email)).isPresent();
    }

    @Test
    @DisplayName("GT-39 #3: 재설정하면 그 계정의 세션과 API 토큰이 모두 거둬진다")
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
        // 새 비밀번호로는 들어간다
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(본문("email", email, "password", NEW_PASSWORD)))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("GT-39 #4: 등록되지 않은 이메일도 보낸 경우와 같은 응답을 낸다")
    void 등록되지_않은_이메일도_같은_응답을_낸다() throws Exception {
        String unknownEmail = 주소("nobody");

        mockMvc.perform(재설정요청(unknownEmail)).andExpect(status().isAccepted());

        assertThat(mail.lastCode(unknownEmail)).isEmpty();
    }

    @Test
    @DisplayName("GT-39 #8: 재설정 코드를 다시 요청하면 앞서 보낸 것이 더 이상 통하지 않는다")
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
    @DisplayName("GT-40 #3: 비밀번호를 바꾸면 지금 쓰는 자리를 뺀 나머지 세션이 거둬진다")
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
    @DisplayName("현재 비밀번호가 맞지 않으면 CURRENT_PASSWORD_MISMATCH 를 낸다")
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
