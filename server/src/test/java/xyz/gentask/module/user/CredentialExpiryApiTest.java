package xyz.gentask.module.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import xyz.gentask.AuthTestSupport;
import xyz.gentask.FakeMailConfiguration;
import xyz.gentask.FakeStorageConfiguration;
import xyz.gentask.TestcontainersConfiguration;
import xyz.gentask.shared.mail.E2eMailSupport.RecordingMailSender;

/**
 * 인증 코드 유효 기간 만료 정책을 검증한다.
 *
 * 코드 만료 상황을 정확히 재현하면서 계정 가입 및 재설정 흐름을 단계별로 검증하기 위해 모의 시계(Clock)의 오프셋을 조정하는 방식을 사용한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({
    TestcontainersConfiguration.class,
    FakeMailConfiguration.class,
    FakeStorageConfiguration.class,
    CredentialExpiryApiTest.MovableClockConfig.class
})
class CredentialExpiryApiTest {

    private static final Duration BEYOND_TTL = Duration.ofMinutes(11);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RecordingMailSender mail;

    @Autowired
    private MovableClock clock;

    @Test
    @DisplayName("회원가입 인증 코드 유효 기간 만료 시 만료 오류를 반환한다")
    void 가입_코드가_만료된다() throws Exception {
        String email = "signup-expiry-" + UUID.randomUUID() + "@example.com";
        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + AuthTestSupport.PASSWORD + "\"}"))
                .andExpect(status().isAccepted());
        String code = AuthTestSupport.받은_코드(mail, email);

        clock.앞으로(BEYOND_TTL);

        mockMvc.perform(post("/api/v1/auth/signup/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"code\":\"" + code + "\"}"))
                .andExpect(status().isGone());
    }

    @Test
    @DisplayName("비밀번호 재설정 코드 유효 기간 만료 시 만료 오류를 반환한다")
    void 재설정_코드가_만료된다() throws Exception {
        String email = "reset-expiry-" + UUID.randomUUID() + "@example.com";
        AuthTestSupport.가입한다(mockMvc, mail, email);

        mockMvc.perform(post("/api/v1/auth/password-reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isAccepted());
        String code = AuthTestSupport.받은_코드(mail, email);

        clock.앞으로(BEYOND_TTL);

        mockMvc.perform(post("/api/v1/auth/password-reset/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"code\":\"" + code
                                + "\",\"newPassword\":\"brand-new-9!\"}"))
                .andExpect(status().isGone());
    }

    /** 시간 경과 시뮬레이션을 위해 오프셋을 조정할 수 있는 모의 시계 구현체다. */
    public static final class MovableClock extends Clock {

        private final ZoneId zone;
        private Duration offset = Duration.ZERO;

        MovableClock(ZoneId zone) {
            this.zone = zone;
        }

        public void 앞으로(Duration amount) {
            offset = offset.plus(amount);
        }

        @Override
        public ZoneId getZone() {
            return zone;
        }

        @Override
        public Clock withZone(ZoneId other) {
            return new MovableClock(other);
        }

        @Override
        public Instant instant() {
            return Instant.now().plus(offset);
        }
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class MovableClockConfig {

        @Bean
        @Primary
        MovableClock movableClock() {
            return new MovableClock(ZoneId.of("Asia/Seoul"));
        }
    }
}
