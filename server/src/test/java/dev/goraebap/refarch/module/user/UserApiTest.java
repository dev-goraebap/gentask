package dev.goraebap.refarch.module.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import dev.goraebap.refarch.AuthTestSupport;
import dev.goraebap.refarch.FakeStorageConfiguration;
import dev.goraebap.refarch.FakeStorageConfiguration.FakeObjectStorage;
import dev.goraebap.refarch.TestcontainersConfiguration;
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

@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, FakeStorageConfiguration.class})
@Transactional
class UserApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FakeObjectStorage fakeStorage;

    @Test
    @DisplayName("등록하면 세션이 붙고 프로필이 초기값으로 조회된다")
    void 등록하면_곧바로_로그인_상태다() throws Exception {
        Cookie session = AuthTestSupport.가입한다(mockMvc, "signup@example.com");

        mockMvc.perform(get("/api/v1/me").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("signup@example.com"))
                .andExpect(jsonPath("$.nickname").value("signup"))
                .andExpect(jsonPath("$.profileImageUrl").value(Matchers.nullValue()))
                .andExpect(jsonPath("$.apiTokenIssuedAt").value(Matchers.nullValue()));
    }

    @Test
    @DisplayName("이미 등록된 이메일은 409 와 EMAIL_ALREADY_USED 를 낸다")
    void 이미_등록된_이메일은_다시_등록되지_않는다() throws Exception {
        AuthTestSupport.가입한다(mockMvc, "dup@example.com");

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"DUP@example.com\",\"password\":\"password-123\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_USED"));
    }

    @Test
    @DisplayName("로그인하면 httpOnly 세션 쿠키를 받는다")
    void 맞는_자격으로_로그인하면_세션_쿠키를_받는다() throws Exception {
        AuthTestSupport.가입한다(mockMvc, "login@example.com");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"login@example.com\",\"password\":\"" + AuthTestSupport.PASSWORD + "\"}"))
                .andExpect(status().isNoContent())
                .andExpect(cookie().exists("session_token"))
                .andExpect(cookie().httpOnly("session_token", true));
    }

    @Test
    @DisplayName("자격이 맞지 않으면 어느 쪽이 틀렸는지 구분하지 않는다")
    void 자격이_맞지_않으면_어느_쪽이_틀렸는지_구분하지_않는다() throws Exception {
        AuthTestSupport.가입한다(mockMvc, "wrong@example.com");

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
    @DisplayName("로그아웃하면 쿠키가 만료되고 그 세션은 401 이다")
    void 로그아웃하면_그_세션으로_다시_닿을_수_없다() throws Exception {
        Cookie session = AuthTestSupport.가입한다(mockMvc, "logout@example.com");

        mockMvc.perform(post("/api/v1/auth/logout").cookie(session))
                .andExpect(status().isNoContent())
                .andExpect(cookie().maxAge("session_token", 0));

        mockMvc.perform(get("/api/v1/me").cookie(session)).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("별명을 고치면 그 별명이 프로필 응답에 남는다")
    void 별명을_고치면_프로필이_그_별명을_보여_준다() throws Exception {
        Cookie session = AuthTestSupport.가입한다(mockMvc, "nick@example.com");

        mockMvc.perform(patch("/api/v1/me")
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nickname\":\"고래밥\"}"))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/me").cookie(session))
                .andExpect(jsonPath("$.nickname").value("고래밥"));
    }

    @Test
    @DisplayName("TG-003.04 #2, #3: 발급한 토큰은 Bearer 인증에 성립하고, 재발급하면 이전 것이 죽는다")
    void 발급한_토큰은_Bearer_인증에_성립하고_재발급하면_이전_것이_죽는다() throws Exception {
        Cookie session = AuthTestSupport.가입한다(mockMvc, "token@example.com");

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
    @DisplayName("TG-003.04 #4: 토큰을 지우면 그 접근이 끊긴다")
    void 토큰을_지우면_그_접근이_끊긴다() throws Exception {
        Cookie session = AuthTestSupport.가입한다(mockMvc, "revoke@example.com");
        String token = 토큰을_발급한다(session);

        mockMvc.perform(delete("/api/v1/me/api-token").cookie(session)).andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/tasks").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("이미지를 올려 확정하면 프로필 응답에 아바타 주소가 실린다")
    void 이미지를_올려_확정하면_아바타_주소가_생긴다() throws Exception {
        Cookie session = AuthTestSupport.가입한다(mockMvc, "avatar@example.com");

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
    @DisplayName("이미지가 아니면 올리기 자리를 내주지 않는다")
    void 이미지가_아니면_올리기_자리를_내주지_않는다() throws Exception {
        Cookie session = AuthTestSupport.가입한다(mockMvc, "notimage@example.com");

        mockMvc.perform(post("/api/v1/attachments/presign")
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slot\":\"USER_PROFILE_IMAGE\",\"fileName\":\"a.pdf\","
                                + "\"contentType\":\"application/pdf\",\"size\":1024}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("FILE_TYPE_NOT_ALLOWED"));
    }

    @Test
    @DisplayName("이메일 형식이 아니면 등록되지 않는다")
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
