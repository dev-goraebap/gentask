package xyz.gentask.module.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import org.hamcrest.Matchers;
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
import xyz.gentask.FakeStorageConfiguration;
import xyz.gentask.FakeStorageConfiguration.FakeObjectStorage;
import xyz.gentask.TestcontainersConfiguration;
import xyz.gentask.shared.mail.E2eMailSupport.RecordingMailSender;

@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, FakeMailConfiguration.class, FakeStorageConfiguration.class})
@Transactional
class UserApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RecordingMailSender mail;

    @Autowired
    private FakeObjectStorage fakeStorage;

    @Test
    @DisplayName("회원가입 완료 시 세션 쿠키가 발급되고 초기 프로필이 반환된다")
    void 등록하면_곧바로_로그인_상태다() throws Exception {
        Cookie session = AuthTestSupport.가입한다(mockMvc, mail, "signup@example.com");

        mockMvc.perform(get("/api/v1/me").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("signup@example.com"))
                .andExpect(jsonPath("$.nickname").value("signup"))
                .andExpect(jsonPath("$.profileImageUrl").value(Matchers.nullValue()))
                .andExpect(jsonPath("$.apiTokenIssuedAt").value(Matchers.nullValue()));
    }

    @Test
    @DisplayName("이미 등록된 이메일로 가입 요청 시 409 Conflict와 EMAIL_ALREADY_USED를 반환한다")
    void 이미_등록된_이메일은_다시_등록되지_않는다() throws Exception {
        AuthTestSupport.가입한다(mockMvc, mail, "dup@example.com");

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"DUP@example.com\",\"password\":\"password-123\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_USED"));
    }

    @Test
    @DisplayName("로그인 성공 시 HttpOnly 세션 쿠키를 발급한다")
    void 맞는_자격으로_로그인하면_세션_쿠키를_받는다() throws Exception {
        AuthTestSupport.가입한다(mockMvc, mail, "login@example.com");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"login@example.com\",\"password\":\"" + AuthTestSupport.PASSWORD + "\"}"))
                .andExpect(status().isNoContent())
                .andExpect(cookie().exists("session_token"))
                .andExpect(cookie().httpOnly("session_token", true));
    }

    @Test
    @DisplayName("로그인 실패 시 계정 존재 여부 및 비밀번호 오류를 구분하지 않고 동일한 오류를 반환한다")
    void 자격이_맞지_않으면_어느_쪽이_틀렸는지_구분하지_않는다() throws Exception {
        AuthTestSupport.가입한다(mockMvc, mail, "wrong@example.com");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"wrong@example.com\",\"password\":\"not-the-password\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nobody@example.com\",\"password\":\"password-123\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    @DisplayName("로그아웃 시 세션 쿠키를 만료 처리하고 이후 요청에 401을 반환한다")
    void 로그아웃하면_그_세션으로_다시_닿을_수_없다() throws Exception {
        Cookie session = AuthTestSupport.가입한다(mockMvc, mail, "logout@example.com");

        mockMvc.perform(post("/api/v1/auth/logout").cookie(session))
                .andExpect(status().isNoContent())
                .andExpect(cookie().maxAge("session_token", 0));

        mockMvc.perform(get("/api/v1/me").cookie(session)).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("닉네임을 수정하면 프로필 응답에 수정된 닉네임이 반영된다")
    void 별명을_고치면_프로필이_그_별명을_보여_준다() throws Exception {
        Cookie session = AuthTestSupport.가입한다(mockMvc, mail, "nick@example.com");

        mockMvc.perform(patch("/api/v1/me")
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nickname\":\"고래밥\"}"))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/me").cookie(session))
                .andExpect(jsonPath("$.nickname").value("고래밥"));
    }

    @Test
    @DisplayName("#2, #3: 발급된 API 토큰으로 Bearer 인증이 가능하며, 재발급 시 기존 토큰은 만료된다")
    void 발급한_토큰은_Bearer_인증에_성립하고_재발급하면_이전_것이_죽는다() throws Exception {
        Cookie session = AuthTestSupport.가입한다(mockMvc, mail, "token@example.com");

        String first = 토큰을_발급한다(session);
        mockMvc.perform(get("/api/v1/tasks").header("Authorization", "Bearer " + first))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/me").cookie(session))
                .andExpect(jsonPath("$.apiTokenIssuedAt").isNotEmpty());

        String second = 토큰을_발급한다(session);
        mockMvc.perform(get("/api/v1/tasks").header("Authorization", "Bearer " + first))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/tasks").header("Authorization", "Bearer " + second))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("API 토큰을 삭제하면 해당 토큰을 사용한 인증이 거부된다")
    void 토큰을_지우면_그_접근이_끊긴다() throws Exception {
        Cookie session = AuthTestSupport.가입한다(mockMvc, mail, "revoke@example.com");
        String token = 토큰을_발급한다(session);

        mockMvc.perform(delete("/api/v1/me/api-token").cookie(session)).andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/tasks").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("프로필 이미지를 업로드하고 확정하면 프로필 응답에 아바타 URL이 포함된다")
    void 이미지를_올려_확정하면_아바타_주소가_생긴다() throws Exception {
        Cookie session = AuthTestSupport.가입한다(mockMvc, mail, "avatar@example.com");

        String body = mockMvc.perform(post("/api/v1/attachments/presign")
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slot\":\"USER_PROFILE_IMAGE\",\"fileName\":\"me.png\","
                                + "\"contentType\":\"image/png\",\"size\":1024}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").isNotEmpty())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String objectKey = JsonPath.read(body, "$.objectKey");

        fakeStorage.put(objectKey, 1024);

        mockMvc.perform(put("/api/v1/me/profile-image")
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"objectKey\":\"" + objectKey + "\"}"))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/me").cookie(session))
                .andExpect(jsonPath("$.profileImageUrl").isNotEmpty());

        mockMvc.perform(delete("/api/v1/me/profile-image").cookie(session)).andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/me").cookie(session))
                .andExpect(jsonPath("$.profileImageUrl").value(Matchers.nullValue()));
    }

    @Test
    @DisplayName("이미지 형식이 아닌 파일은 아바타 업로드 URL 발급을 거부한다")
    void 이미지가_아니면_올리기_자리를_내주지_않는다() throws Exception {
        Cookie session = AuthTestSupport.가입한다(mockMvc, mail, "notimage@example.com");

        mockMvc.perform(post("/api/v1/attachments/presign")
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slot\":\"USER_PROFILE_IMAGE\",\"fileName\":\"a.pdf\","
                                + "\"contentType\":\"application/pdf\",\"size\":1024}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("FILE_TYPE_NOT_ALLOWED"));
    }

    @Test
    @DisplayName("이메일 형식이 올바르지 않으면 가입 요청을 거부한다")
    void 이메일_형식이_아니면_등록되지_않는다() throws Exception {
        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"not-an-email\",\"password\":\"password-123\"}"))
                .andExpect(status().isBadRequest());
    }

    private String 토큰을_발급한다(Cookie session) throws Exception {
        String body = mockMvc.perform(post("/api/v1/me/api-token").cookie(session))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return JsonPath.read(body, "$.token");
    }
}
