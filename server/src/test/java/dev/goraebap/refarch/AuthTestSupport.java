package dev.goraebap.refarch;

import static java.util.Objects.requireNonNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.goraebap.refarch.shared.mail.E2eMailSupport.RecordingMailSender;
import jakarta.servlet.http.Cookie;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

public final class AuthTestSupport {

    public static final String PASSWORD = "password-123";

    private AuthTestSupport() {}

    /**
     * 이미 있는 계정이면 로그인해서 세션을 얻는다.
     *
     * <p>트랜잭션을 두지 않는 시험은 앞 시험이 만든 계정이 남는다. 설정으로 고정된 계정(첫 관리자)은
     * 매번 새로 만들 수 없으므로 이 자리가 두 경우를 함께 다룬다.
     */
    public static Cookie 가입하거나_로그인한다(MockMvc mockMvc, RecordingMailSender mail, String email) throws Exception {
        var requested = mockMvc.perform(요청(email)).andReturn();
        if (requested.getResponse().getStatus() == 202) {
            return 코드로_마친다(mockMvc, mail, email);
        }
        return 로그인한다(mockMvc, email);
    }

    /** 가입은 두 단계다. 코드를 메일에서 꺼내 두 번째 단계에 넣는다. */
    public static Cookie 가입한다(MockMvc mockMvc, RecordingMailSender mail, String email) throws Exception {
        mockMvc.perform(요청(email)).andExpect(status().isAccepted());
        return 코드로_마친다(mockMvc, mail, email);
    }

    public static Cookie 로그인한다(MockMvc mockMvc, String email) throws Exception {
        return requireNonNull(mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isNoContent())
                .andReturn()
                .getResponse()
                .getCookie("session_token"));
    }

    public static String 받은_코드(RecordingMailSender mail, String email) {
        return mail.lastCode(email).orElseThrow(() -> new IllegalStateException("보낸 코드가 없다: " + email));
    }

    private static org.springframework.test.web.servlet.RequestBuilder 요청(String email) {
        return post("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}");
    }

    private static Cookie 코드로_마친다(MockMvc mockMvc, RecordingMailSender mail, String email) throws Exception {
        String code = 받은_코드(mail, email);
        return requireNonNull(mockMvc.perform(post("/api/v1/auth/signup/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"code\":\"" + code + "\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getCookie("session_token"));
    }
}
