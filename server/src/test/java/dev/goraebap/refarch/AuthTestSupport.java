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
