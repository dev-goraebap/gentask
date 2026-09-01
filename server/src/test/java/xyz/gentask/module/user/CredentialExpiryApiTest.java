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
 * 코드의 수명이 지난 뒤의 자리.
 *
 * <p>수명을 0으로 두면 가입 자체가 지나지 못해 재설정을 볼 계정도 만들 수 없다. 그래서 설정 대신
 * 시계를 민다.
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
    @DisplayName("TG-038 #6: 가입 코드의 수명이 지나면 만료를 알린다")
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
    @DisplayName("TG-039 #7: 재설정 코드의 수명이 지나면 만료를 알린다")
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

    /** 밀 수 있는 시계. 민 만큼만 앞서고 그 밖에는 실제 시각을 따른다. */
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
