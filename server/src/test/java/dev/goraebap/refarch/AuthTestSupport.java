package dev.goraebap.refarch;

import static java.util.Objects.requireNonNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
    public static Cookie 가입하거나_로그인한다(MockMvc mockMvc, String email) throws Exception {
        var signup = mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andReturn();
        if (signup.getResponse().getStatus() == 201) {
            return requireNonNull(signup.getResponse().getCookie("session_token"));
        }
        return requireNonNull(mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isNoContent())
                .andReturn()
                .getResponse()
                .getCookie("session_token"));
    }

    public static Cookie 가입한다(MockMvc mockMvc, String email) throws Exception {
        return requireNonNull(mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getCookie("session_token"));
    }
}
