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

    /**
     * 기존 계정이면 로그인하여 세션을 획득하고, 미가입 계정이면 회원가입 후 세션을 획득한다.
     *
     * 트랜잭션 롤백을 수행하지 않는 테스트 환경 및 사전 정의된 고정 계정(초기 관리자)을 지원하기 위해 가입과 로그인을 통합 처리한다.
     */
    public static Cookie 가입하거나_로그인한다(MockMvc mockMvc, RecordingMailSender mail, String email) throws Exception {
        var requested = mockMvc.perform(요청(email)).andReturn();
        if (requested.getResponse().getStatus() == 202) {
            return 코드로_마친다(mockMvc, mail, email);
        }
        return 로그인한다(mockMvc, email);
    }

    /** 인증 코드를 수신하여 회원가입 절차를 완료하고 세션 쿠키를 반환한다. */
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
