package xyz.gentask.module.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
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
import xyz.gentask.module.notification.application.reminder.PushSender;
import xyz.gentask.module.notification.application.reminder.ReminderDispatchService;
import xyz.gentask.module.notification.domain.subscription.PushSubscription;
import xyz.gentask.shared.mail.E2eMailSupport.RecordingMailSender;

/**
 * 관리자의 푸시 알림 발송 실패 내역 조회 및 처리 API를 검증한다.
 *
 * 발송 실패 상황을 재현하기 위해 발송 포트를 모의 구현체로 대체하며, 스케줄러 실행 환경과 동일하게 비트랜잭션 환경에서 검증한다.
 */
@SpringBootTest(properties = "app.admin.email=" + AdminPushApiTest.ADMIN_EMAIL)
@AutoConfigureMockMvc
@Import({
    TestcontainersConfiguration.class,
    FakeMailConfiguration.class,
    FakeStorageConfiguration.class,
    AdminPushApiTest.AlwaysFailingSenderConfig.class
})
class AdminPushApiTest {

    static final String ADMIN_EMAIL = "admin-push-fixture@example.com";

    private static final DateTimeFormatter REMIND_AT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RecordingMailSender mail;

    @Autowired
    private ReminderDispatchService reminderDispatchService;

    @Autowired
    private AlwaysFailingSender sender;

    @Autowired
    private Clock clock;

    @Test
    @DisplayName("관리자가 푸시 발송 실패 목록을 조회하면 최근 실패 내역부터 반환한다")
    void 실패한_자리가_최근_것부터_온다() throws Exception {
        Cookie admin = 관리자로_가입한다();
        String endpoint = 실패를_하나_만든다();

        mockMvc.perform(get("/api/v1/admin/push/failures").cookie(admin).param("size", "100"))
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.items[?(@.endpoint == '" + endpoint + "')]").exists())
                .andExpect(jsonPath("$.items[?(@.endpoint == '" + endpoint + "')].reason")
                        .value(org.hamcrest.Matchers.hasItem("FAILED")))
                // 사용자 이메일은 user 모듈 인터페이스를 통해 조회한다.
                .andExpect(jsonPath("$.items[?(@.endpoint == '" + endpoint + "')].email")
                        .isNotEmpty());
    }

    @Test
    @DisplayName("실패 엔드포인트를 구독 해제하면 해당 기기는 이후 발송 대상에서 제외한다")
    void 자리를_거두면_보낼_대상이_아니다() throws Exception {
        Cookie admin = 관리자로_가입한다();
        String endpoint = 실패를_하나_만든다();
        String failureId = 항목의_아이디를_찾는다(admin, endpoint);

        mockMvc.perform(post("/api/v1/admin/push/failures/" + failureId + "/revoke")
                        .cookie(admin))
                .andExpect(status().isNoContent());

        sender.sent.clear();
        reminderDispatchService.dispatchDue();
        assertThat(sender.sent).doesNotContain(endpoint);
    }

    @Test
    @DisplayName("실패 내역을 처리 완료 상태로 변경하면 기본 미처리 목록에서 제외된다")
    void 처리하면_처리됨으로_갈린다() throws Exception {
        Cookie admin = 관리자로_가입한다();
        String endpoint = 실패를_하나_만든다();
        String failureId = 항목의_아이디를_찾는다(admin, endpoint);

        mockMvc.perform(post("/api/v1/admin/push/failures/" + failureId + "/resolve")
                        .cookie(admin))
                .andExpect(status().isNoContent());

        // 기본 목록은 미처리 실패 내역만 반환한다.
        mockMvc.perform(get("/api/v1/admin/push/failures").cookie(admin).param("size", "100"))
                .andExpect(
                        jsonPath("$.items[?(@.endpoint == '" + endpoint + "')]").doesNotExist());

        mockMvc.perform(get("/api/v1/admin/push/failures")
                        .cookie(admin)
                        .param("includeResolved", "true")
                        .param("size", "100"))
                .andExpect(jsonPath("$.items[?(@.endpoint == '" + endpoint + "')].resolvedAt")
                        .isNotEmpty());
    }

    // --- 준비 --------------------------------------------------------------------------------------------------------

    private Cookie 관리자로_가입한다() throws Exception {
        return AuthTestSupport.가입하거나_로그인한다(mockMvc, mail, ADMIN_EMAIL);
    }

    /** 만료된 미리 알림을 발송 처리하여 의도적으로 실패 이력을 생성한다. */
    private String 실패를_하나_만든다() throws Exception {
        Cookie session = AuthTestSupport.가입한다(mockMvc, mail, "failing-" + UUID.randomUUID() + "@example.com");
        String endpoint = "https://push.example.com/admin-" + UUID.randomUUID();
        구독한다(session, endpoint);
        작업을_만든다(session, "닿지 않는 알림");

        reminderDispatchService.dispatchDue();
        return endpoint;
    }

    private String 항목의_아이디를_찾는다(Cookie admin, String endpoint) throws Exception {
        String body = mockMvc.perform(get("/api/v1/admin/push/failures")
                        .cookie(admin)
                        .param("includeResolved", "true")
                        .param("size", "100"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        int at = body.indexOf(endpoint);
        assertThat(at).as("실패 기록이 목록에 없습니다").isNotNegative();

        // JSON 응답에서 endpoint 직전에 위치한 id 속성값을 추출한다.
        String head = body.substring(0, at);
        int idAt = head.lastIndexOf("\"id\":\"") + "\"id\":\"".length();
        return head.substring(idAt, head.indexOf('"', idAt));
    }

    private void 구독한다(Cookie session, String endpoint) throws Exception {
        mockMvc.perform(post("/api/v1/push/subscription")
                .cookie(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"endpoint\":\"" + endpoint + "\",\"p256dh\":\"key\",\"auth\":\"secret\"}"));
    }

    private void 작업을_만든다(Cookie session, String title) throws Exception {
        String location = mockMvc.perform(post("/api/v1/tasks")
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + title + "\"}"))
                .andReturn()
                .getResponse()
                .getHeader("Location");
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(location)
                .cookie(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"" + title + "\",\"note\":\"\",\"dueDate\":null,\"remindAt\":\""
                        + LocalDateTime.now(clock).minusMinutes(1).format(REMIND_AT) + "\"}"));
    }

    /** 늘 실패로 답한다. 관리 화면이 다룰 항목을 만드는 것이 이 시험의 목적이다. */
    static class AlwaysFailingSender implements PushSender {
        final List<String> sent = new ArrayList<>();

        @Override
        public Outcome send(PushSubscription subscription, String payload) {
            sent.add(subscription.endpoint());
            return Outcome.failed("시험이 늘 실패로 정했다");
        }
    }

    @TestConfiguration
    static class AlwaysFailingSenderConfig {
        @Bean
        @Primary
        AlwaysFailingSender alwaysFailingSender() {
            return new AlwaysFailingSender();
        }
    }
}
