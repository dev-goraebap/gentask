package dev.goraebap.refarch.module.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import dev.goraebap.refarch.AuthTestSupport;
import dev.goraebap.refarch.FakeStorageConfiguration;
import dev.goraebap.refarch.TestcontainersConfiguration;
import dev.goraebap.refarch.module.notification.application.PushSender;
import dev.goraebap.refarch.module.notification.application.ReminderDispatchService;
import dev.goraebap.refarch.module.notification.domain.failure.PushDeliveryFailure;
import dev.goraebap.refarch.module.notification.domain.failure.PushFailureQuery;
import dev.goraebap.refarch.module.notification.domain.subscription.PushSubscription;
import jakarta.servlet.http.Cookie;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
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

/**
 * 정한 시각에 보내는 경로. 실제 푸시 서비스에 닿지 않도록 발송 포트를 가짜로 바꾼다.
 *
 * <p>트랜잭션을 두지 않는 것은 스케줄러가 그렇게 도는 것과 같은 조건에서 보기 위해서다. 각 테스트가
 * 자기 사용자를 새로 만들어 서로 간섭하지 않는다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, FakeStorageConfiguration.class, ReminderDispatchTest.FakeSenderConfig.class
})
class ReminderDispatchTest {

    private static final DateTimeFormatter REMIND_AT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ReminderDispatchService reminderDispatchService;

    @Autowired
    private FakeSender fakeSender;

    @Autowired
    private PushFailureQuery pushFailureQuery;

    @Autowired
    private Clock clock;

    @BeforeEach
    void 보낸_것을_비운다() {
        fakeSender.sent.clear();
        fakeSender.gone.clear();
        fakeSender.failed.clear();
    }

    @Test
    @DisplayName("TG-007.02 #1, #2: 시각이 지나면 켜 둔 기기로 작업 제목을 담아 보낸다")
    void 시각이_지나면_제목을_담아_보낸다() throws Exception {
        Cookie session = 가입한다();
        구독한다(session, "https://push.example.com/" + UUID.randomUUID());
        작업을_만든다(session, "약 먹기", 지난_시각());

        reminderDispatchService.dispatchDue();

        assertThat(fakeSender.sent).hasSize(1);
        assertThat(fakeSender.sent.getFirst()).contains("약 먹기");
    }

    @Test
    @DisplayName("TG-007.02 #3: 이미 보낸 미리 알림은 다시 보내지 않는다")
    void 이미_보낸_것은_다시_보내지_않는다() throws Exception {
        Cookie session = 가입한다();
        구독한다(session, "https://push.example.com/" + UUID.randomUUID());
        작업을_만든다(session, "한 번만", 지난_시각());

        reminderDispatchService.dispatchDue();
        fakeSender.sent.clear();
        reminderDispatchService.dispatchDue();

        assertThat(fakeSender.sent).isEmpty();
    }

    @Test
    @DisplayName("TG-007.02 #4: 자리가 더 이상 유효하지 않으면 그 자리를 거둔다")
    void 죽은_자리는_거둔다() throws Exception {
        Cookie session = 가입한다();
        String endpoint = "https://push.example.com/gone-" + UUID.randomUUID();
        구독한다(session, endpoint);
        작업을_만든다(session, "죽은 자리", 지난_시각());
        fakeSender.gone.add(endpoint);

        reminderDispatchService.dispatchDue();

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(
                                "/api/v1/push/subscription")
                        .cookie(session)
                        .param("endpoint", endpoint))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.registered")
                        .value(false));
    }

    @Test
    @DisplayName("TG-007.02 #5: 켜 둔 기기가 없으면 보내지 않고 넘어간다")
    void 켜_둔_기기가_없으면_넘어간다() throws Exception {
        Cookie session = 가입한다();
        작업을_만든다(session, "받을 사람 없음", 지난_시각());

        reminderDispatchService.dispatchDue();

        assertThat(fakeSender.sent).isEmpty();
    }

    @Test
    @DisplayName("TG-008.02 #1: 발송이 실패하면 그 자리와 사유와 시각을 남긴다")
    void 발송이_실패하면_기록을_남긴다() throws Exception {
        Cookie session = 가입한다();
        String endpoint = "https://push.example.com/failed-" + UUID.randomUUID();
        구독한다(session, endpoint);
        작업을_만든다(session, "닿지 않는 알림", 지난_시각());
        fakeSender.failed.add(endpoint);

        reminderDispatchService.dispatchDue();

        PushDeliveryFailure recorded = 기록을_찾는다(endpoint);
        assertThat(recorded).isNotNull();
        assertThat(recorded.reason()).isEqualTo(PushDeliveryFailure.Reason.FAILED);
        assertThat(recorded.detail()).isEqualTo("시험이 실패로 정했다");
        assertThat(recorded.occurredAt()).isNotNull();
        assertThat(recorded.isResolved()).isFalse();
    }

    @Test
    @DisplayName("TG-008.02 #5: 자리가 사라졌다고 답하면 스스로 거두고 그 사실을 남긴다")
    void 자리가_사라지면_거두고_남긴다() throws Exception {
        Cookie session = 가입한다();
        String endpoint = "https://push.example.com/gone-record-" + UUID.randomUUID();
        구독한다(session, endpoint);
        작업을_만든다(session, "사라진 자리", 지난_시각());
        fakeSender.gone.add(endpoint);

        reminderDispatchService.dispatchDue();

        PushDeliveryFailure recorded = 기록을_찾는다(endpoint);
        assertThat(recorded).isNotNull();
        assertThat(recorded.reason()).isEqualTo(PushDeliveryFailure.Reason.GONE);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(
                                "/api/v1/push/subscription")
                        .cookie(session)
                        .param("endpoint", endpoint))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.registered")
                        .value(false));
    }

    @Test
    @DisplayName("아직 시각이 오지 않은 미리 알림은 보내지 않는다")
    void 아직_시각이_오지_않으면_보내지_않는다() throws Exception {
        Cookie session = 가입한다();
        구독한다(session, "https://push.example.com/" + UUID.randomUUID());
        작업을_만든다(session, "나중에", LocalDateTime.now(clock).plusDays(1).format(REMIND_AT));

        reminderDispatchService.dispatchDue();

        assertThat(fakeSender.sent).isEmpty();
    }

    // --- 보조 --------------------------------------------------------------------------------------------------------

    /** 이 회차가 남긴 기록을 endpoint 로 집어낸다. 다른 시험의 기록이 함께 있으므로 걸러 낸다. */
    private PushDeliveryFailure 기록을_찾는다(String endpoint) {
        return pushFailureQuery.search(true, 200, 0).stream()
                .filter(failure -> failure.endpoint().equals(endpoint))
                .findFirst()
                .orElse(null);
    }

    private String 지난_시각() {
        return LocalDateTime.now(clock).minusMinutes(1).format(REMIND_AT);
    }

    private Cookie 가입한다() throws Exception {
        return AuthTestSupport.가입한다(mockMvc, "reminder-" + UUID.randomUUID() + "@example.com");
    }

    private void 구독한다(Cookie session, String endpoint) throws Exception {
        mockMvc.perform(post("/api/v1/push/subscription")
                .cookie(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"endpoint\":\"" + endpoint + "\",\"p256dh\":\"BFake\",\"auth\":\"Fake\"}"));
    }

    /** 생성은 제목만 받는다. 미리 알림은 편집으로 붙는다 — TSK-001 의 A3 이 그 흐름이다. */
    private void 작업을_만든다(Cookie session, String title, String remindAt) throws Exception {
        String location = mockMvc.perform(post("/api/v1/tasks")
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + title + "\"}"))
                .andReturn()
                .getResponse()
                .getHeader("Location");

        mockMvc.perform(patch(location)
                .cookie(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"" + title + "\",\"note\":\"\",\"dueDate\":null,\"remindAt\":\"" + remindAt
                        + "\"}"));
    }

    /** 실제 푸시 서비스에 닿지 않는다. 무엇을 보냈는지와 어느 자리를 죽었다고 답할지를 시험이 정한다. */
    static class FakeSender implements PushSender {
        final List<String> sent = new ArrayList<>();
        final List<String> gone = new ArrayList<>();
        final List<String> failed = new ArrayList<>();

        @Override
        public Outcome send(PushSubscription subscription, String payload) {
            if (gone.contains(subscription.endpoint())) {
                return Outcome.gone("시험이 죽은 자리로 정했다");
            }
            if (failed.contains(subscription.endpoint())) {
                return Outcome.failed("시험이 실패로 정했다");
            }
            sent.add(payload);
            return Outcome.sent();
        }
    }

    @TestConfiguration
    static class FakeSenderConfig {
        @Bean
        @Primary
        FakeSender fakeSender() {
            return new FakeSender();
        }
    }
}
