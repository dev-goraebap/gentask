package xyz.gentask.module.notification;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import java.util.UUID;
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
import xyz.gentask.TestcontainersConfiguration;
import xyz.gentask.shared.mail.E2eMailSupport.RecordingMailSender;

/**
 * 푸시 알림 구독 등록 및 해제 API 명세를 검증한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, FakeMailConfiguration.class, FakeStorageConfiguration.class})
@Transactional
class PushApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RecordingMailSender mail;

    @Test
    @DisplayName("푸시 구독 정보를 등록하면 해당 기기의 구독 상태가 활성화된다")
    void 구독을_보내면_받을_자리로_등록된다() throws Exception {
        Cookie session = AuthTestSupport.가입한다(mockMvc, mail, "push-" + UUID.randomUUID() + "@example.com");
        String endpoint = "https://push.example.com/" + UUID.randomUUID();

        등록한다(session, endpoint).andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/push/subscription").cookie(session).param("endpoint", endpoint))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.registered").value(true));
    }

    @Test
    @DisplayName("푸시 구독을 삭제하면 해당 기기의 구독 상태가 비활성화된다")
    void 구독을_지우면_그_자리가_사라진다() throws Exception {
        Cookie session = AuthTestSupport.가입한다(mockMvc, mail, "push-" + UUID.randomUUID() + "@example.com");
        String endpoint = "https://push.example.com/" + UUID.randomUUID();
        등록한다(session, endpoint);

        mockMvc.perform(delete("/api/v1/push/subscription")
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"endpoint\":\"" + endpoint + "\"}"))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/push/subscription").cookie(session).param("endpoint", endpoint))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.registered").value(false));
    }

    @Test
    @DisplayName("동일 계정의 다른 기기에서 구독을 등록하면 기존 기기와 함께 다중 등록된다")
    void 다른_기기에서_켜면_나란히_등록된다() throws Exception {
        Cookie session = AuthTestSupport.가입한다(mockMvc, mail, "push-" + UUID.randomUUID() + "@example.com");
        String first = "https://push.example.com/" + UUID.randomUUID();
        String second = "https://push.example.com/" + UUID.randomUUID();

        등록한다(session, first);
        등록한다(session, second);

        for (String endpoint : new String[] {first, second}) {
            mockMvc.perform(get("/api/v1/push/subscription").cookie(session).param("endpoint", endpoint))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.registered").value(true));
        }
    }

    @Test
    @DisplayName("동일한 엔드포인트로 중복 등록 요청 시 기존 구독을 유지한다")
    void 같은_구독을_두_번_보내도_하나로_남는다() throws Exception {
        Cookie session = AuthTestSupport.가입한다(mockMvc, mail, "push-" + UUID.randomUUID() + "@example.com");
        String endpoint = "https://push.example.com/" + UUID.randomUUID();

        등록한다(session, endpoint).andExpect(status().isNoContent());
        등록한다(session, endpoint).andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/push/subscription").cookie(session).param("endpoint", endpoint))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.registered").value(true));
    }

    @Test
    @DisplayName("타 사용자의 푸시 구독 엔드포인트는 조회되지 않는다")
    void 남의_자리는_내_것으로_조회되지_않는다() throws Exception {
        Cookie mine = AuthTestSupport.가입한다(mockMvc, mail, "push-" + UUID.randomUUID() + "@example.com");
        Cookie other = AuthTestSupport.가입한다(mockMvc, mail, "push-" + UUID.randomUUID() + "@example.com");
        String endpoint = "https://push.example.com/" + UUID.randomUUID();
        등록한다(other, endpoint);

        mockMvc.perform(get("/api/v1/push/subscription").cookie(mine).param("endpoint", endpoint))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.registered").value(false));
    }

    @Test
    @DisplayName("VAPID 설정 조회 시 공개 키만 반환하고 개인 키는 노출하지 않는다")
    void 공개_키를_내주고_개인_키는_내주지_않는다() throws Exception {
        Cookie session = AuthTestSupport.가입한다(mockMvc, mail, "push-" + UUID.randomUUID() + "@example.com");

        mockMvc.perform(get("/api/v1/push/config").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publicKey").isNotEmpty())
                .andExpect(jsonPath("$.privateKey").doesNotExist());
    }

    private org.springframework.test.web.servlet.ResultActions 등록한다(Cookie session, String endpoint) throws Exception {
        return mockMvc.perform(post("/api/v1/push/subscription")
                .cookie(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"endpoint\":\"" + endpoint + "\",\"p256dh\":\"BFakePublicKey\",\"auth\":\"FakeAuth\"}"));
    }
}
