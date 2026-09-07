package xyz.gentask.module.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static xyz.gentask.jooq.Tables.USERS;
import static xyz.gentask.jooq.Tables.VERIFICATION_CODES;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.Executors;
import org.jooq.DSLContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import xyz.gentask.AuthTestSupport;
import xyz.gentask.FakeMailConfiguration;
import xyz.gentask.TestcontainersConfiguration;
import xyz.gentask.shared.mail.E2eMailSupport.RecordingMailSender;

@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, FakeMailConfiguration.class})
class CredentialApiTest {
    @Autowired
    private MockMvc mvc;

    @Autowired
    private RecordingMailSender mail;

    @Autowired
    private DSLContext dsl;

    @Test
    void 인증_전에는_계정이_없고_인증하면_세션을_발급한다() throws Exception {
        String email = email();
        request(email).andExpect(status().isAccepted());
        assertThat(dsl.fetchExists(USERS, USERS.EMAIL_NORMALIZED.eq(email))).isFalse();
        confirm(email, AuthTestSupport.받은_코드(mail, email))
                .andExpect(status().isNoContent())
                .andExpect(cookie().exists("session_token"))
                .andExpect(cookie().httpOnly("session_token", true));
        assertThat(dsl.fetchCount(USERS, USERS.EMAIL_NORMALIZED.eq(email))).isEqualTo(1);
    }

    @Test
    void 기존_이메일은_같은_계정으로_로그인한다() throws Exception {
        String email = email();
        var session = AuthTestSupport.가입한다(mvc, mail, email);
        var id = dsl.select(USERS.ID)
                .from(USERS)
                .where(USERS.EMAIL_NORMALIZED.eq(email))
                .fetchSingle(USERS.ID);
        allowResend(email);
        request(email.toUpperCase(java.util.Locale.ROOT)).andExpect(status().isAccepted());
        confirm(email, AuthTestSupport.받은_코드(mail, email.toUpperCase(java.util.Locale.ROOT)))
                .andExpect(status().isNoContent());
        assertThat(dsl.select(USERS.ID)
                        .from(USERS)
                        .where(USERS.EMAIL_NORMALIZED.eq(email))
                        .fetchSingle(USERS.ID))
                .isEqualTo(id);
        mvc.perform(get("/api/v1/me").cookie(session)).andExpect(status().isOk());
    }

    @Test
    void 인증번호는_한번만_사용할_수_있다() throws Exception {
        String email = email();
        request(email);
        String code = AuthTestSupport.받은_코드(mail, email);
        confirm(email, code).andExpect(status().isNoContent());
        confirm(email, code).andExpect(status().isGone());
    }

    @Test
    void 동시에_확인해도_한번만_로그인한다() throws Exception {
        String email = email();
        request(email);
        String code = AuthTestSupport.받은_코드(mail, email);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(
                    () -> confirm(email, code).andReturn().getResponse().getStatus());
            var second = executor.submit(
                    () -> confirm(email, code).andReturn().getResponse().getStatus());
            assertThat(java.util.List.of(first.get(), second.get())).containsExactlyInAnyOrder(204, 410);
        }
    }

    @Test
    void 반복_오입력은_트랜잭션_종료_후에도_누적된다() throws Exception {
        String email = email();
        request(email);
        String real = AuthTestSupport.받은_코드(mail, email);
        for (int i = 0; i < 4; i++) confirm(email, "invalid").andExpect(status().isBadRequest());
        confirm(email, "invalid").andExpect(status().isGone());
        confirm(email, real).andExpect(status().isGone());
        request(email).andExpect(status().isTooManyRequests());
    }

    @Test
    void 재발송을_제한하고_재발송하면_앞의_번호를_거둔다() throws Exception {
        String email = email();
        request(email);
        String previous = AuthTestSupport.받은_코드(mail, email);
        request(email).andExpect(status().isTooManyRequests());
        allowResend(email);
        request(email).andExpect(status().isAccepted());
        String next = AuthTestSupport.받은_코드(mail, email);
        if (!previous.equals(next)) confirm(email, previous).andExpect(status().isBadRequest());
        confirm(email, next).andExpect(status().isNoContent());
    }

    @Test
    void 비밀번호_로그인과_가입_경로는_더이상_제공하지_않는다() throws Exception {
        for (String route : java.util.List.of("login", "signup", "password-reset", "legacy-login")) {
            mvc.perform(post("/api/v1/auth/" + route)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"old@example.com\",\"password\":\"password-123\"}"))
                    .andExpect(status().isUnauthorized());
        }
    }

    private String email() {
        return "otp-" + UUID.randomUUID() + "@example.com";
    }

    private void allowResend(String email) {
        dsl.update(VERIFICATION_CODES)
                .set(VERIFICATION_CODES.CREATED_AT, Instant.now().minusSeconds(61))
                .where(VERIFICATION_CODES.EMAIL_NORMALIZED.eq(email))
                .execute();
    }

    private ResultActions request(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/login/code")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\"}"));
    }

    private ResultActions confirm(String email, String code) throws Exception {
        return mvc.perform(post("/api/v1/auth/login/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"code\":\"" + code + "\"}"));
    }
}
