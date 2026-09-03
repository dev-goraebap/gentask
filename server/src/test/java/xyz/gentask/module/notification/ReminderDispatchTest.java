package xyz.gentask.module.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

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
import xyz.gentask.AuthTestSupport;
import xyz.gentask.FakeMailConfiguration;
import xyz.gentask.FakeStorageConfiguration;
import xyz.gentask.TestcontainersConfiguration;
import xyz.gentask.module.notification.application.reminder.PushSender;
import xyz.gentask.module.notification.application.reminder.ReminderDispatchService;
import xyz.gentask.module.notification.domain.failure.PushDeliveryFailure;
import xyz.gentask.module.notification.domain.failure.PushFailureQuery;
import xyz.gentask.module.notification.domain.subscription.PushSubscription;
import xyz.gentask.shared.mail.E2eMailSupport.RecordingMailSender;

/**
 * 예약 시각 도래에 따른 푸시 알림 발송 스케줄러를 검증한다.
 *
 * 실제 외부 푸시 서비스 호출을 방지하기 위해 모의 발송 포트를 사용하며, 스케줄러 환경과 동일하게 비트랜잭션으로 실행한다. 각 테스트는 전용 사용자를 생성하여 독립성을 유지한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({
    TestcontainersConfiguration.class,
    FakeMailConfiguration.class,
    FakeStorageConfiguration.class,
    ReminderDispatchTest.FakeSenderConfig.class
})
class ReminderDispatchTest {

    private static final DateTimeFormatter REMIND_AT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RecordingMailSender mail;

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
    @DisplayName("#1, #2: 알림 시각이 도래하면 등록된 기기로 작업 제목이 포함된 푸시 알림을 발송한다")
    void 시각이_지나면_제목을_담아_보낸다() throws Exception {
        Cookie session = 가입한다();
        구독한다(session, "https://push.example.com/" + UUID.randomUUID());
        작업을_만든다(session, "약 먹기", 지난_시각());

        reminderDispatchService.dispatchDue();

        assertThat(fakeSender.sent).hasSize(1);
        assertThat(fakeSender.sent.getFirst()).contains("약 먹기");
    }

    @Test
    @DisplayName("이미 발송된 미리 알림은 중복 발송하지 않는다")
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
    @DisplayName("구독 엔드포인트가 만료되면 해당 구독을 자동 해제한다")
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
    @DisplayName("등록된 기기 구독이 없으면 발송을 건너뛴다")
    void 켜_둔_기기가_없으면_넘어간다() throws Exception {
        Cookie session = 가입한다();
        작업을_만든다(session, "받을 사람 없음", 지난_시각());

        reminderDispatchService.dispatchDue();

        assertThat(fakeSender.sent).isEmpty();
    }

    @Test
    @DisplayName("발송 실패 시 대상 엔드포인트, 실패 사유, 발생 시각을 기록한다")
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
    @DisplayName("엔드포인트 만료 응답 수신 시 구독을 해제하고 실패 이력을 기록한다")
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
    @DisplayName("예약 시각이 도래하지 않은 미리 알림은 발송하지 않는다")
    void 아직_시각이_오지_않으면_보내지_않는다() throws Exception {
        Cookie session = 가입한다();
        구독한다(session, "https://push.example.com/" + UUID.randomUUID());
        작업을_만든다(session, "나중에", LocalDateTime.now(clock).plusDays(1).format(REMIND_AT));

        reminderDispatchService.dispatchDue();

        assertThat(fakeSender.sent).isEmpty();
    }

    // --- 보조 --------------------------------------------------------------------------------------------------------

    /** 대상 endpoint와 일치하는 실패 기록을 조회한다. */
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
        return AuthTestSupport.가입한다(mockMvc, mail, "reminder-" + UUID.randomUUID() + "@example.com");
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
