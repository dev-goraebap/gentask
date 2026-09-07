package xyz.gentask;

import static java.util.Objects.requireNonNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import xyz.gentask.shared.mail.E2eMailSupport.RecordingMailSender;

public final class AuthTestSupport {
    public static final String PASSWORD = "password-123";

    private AuthTestSupport() {}

    public static Cookie 가입하거나_로그인한다(MockMvc mvc, RecordingMailSender mail, String email) throws Exception {
        return 가입한다(mvc, mail, email);
    }

    public static Cookie 가입한다(MockMvc mvc, RecordingMailSender mail, String email) throws Exception {
        mvc.perform(post("/api/v1/auth/login/code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isAccepted());
        return requireNonNull(mvc.perform(post("/api/v1/auth/login/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"code\":\"" + 받은_코드(mail, email) + "\"}"))
                .andExpect(status().isNoContent())
                .andReturn()
                .getResponse()
                .getCookie("session_token"));
    }

    public static String 받은_코드(RecordingMailSender mail, String email) {
        return mail.lastCode(email).orElseThrow();
    }
}
