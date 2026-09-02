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
 * 관리자가 알림 문제를 보고 정리하는 경로.
 *
 * <p>실패를 만들어야 목록이 서므로 발송 포트를 가짜로 바꾼다. 트랜잭션을 두지 않는 것은 스케줄러가 그렇게
 * 도는 것과 같은 조건에서 보기 위해서다.
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
    @DisplayName("GT-37 #2: 관리자가 알림 문제를 열면 실패한 자리가 최근 것부터 온다")
    void 실패한_자리가_최근_것부터_온다() throws Exception {
        Cookie admin = 관리자로_가입한다();
        String endpoint = 실패를_하나_만든다();

        mockMvc.perform(get("/api/v1/admin/push/failures").cookie(admin).param("size", "100"))
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.items[?(@.endpoint == '" + endpoint + "')]").exists())
                .andExpect(jsonPath("$.items[?(@.endpoint == '" + endpoint + "')].reason")
                        .value(org.hamcrest.Matchers.hasItem("FAILED")))
                // 사용자를 이름으로 보여 주는 것은 user 모듈의 창구를 지난다
                .andExpect(jsonPath("$.items[?(@.endpoint == '" + endpoint + "')].email")
                        .isNotEmpty());
    }

    @Test
    @DisplayName("GT-37 #3: 자리를 거두면 그 기기는 더 이상 보낼 대상이 아니다")
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
    @DisplayName("GT-37 #4: 처리했다고 표시하면 그 항목이 처리됨으로 갈린다")
    void 처리하면_처리됨으로_갈린다() throws Exception {
        Cookie admin = 관리자로_가입한다();
        String endpoint = 실패를_하나_만든다();
        String failureId = 항목의_아이디를_찾는다(admin, endpoint);

        mockMvc.perform(post("/api/v1/admin/push/failures/" + failureId + "/resolve")
                        .cookie(admin))
                .andExpect(status().isNoContent());

        // 기본 목록은 처리 안 된 것만 보여 준다
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

    /** 미리 알림 하나를 시각이 지난 채로 두고 회차를 돌려 실패 기록을 만든다. */
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

        // 그 항목의 id 는 endpoint 보다 앞에 있다. 마지막으로 나오는 것이 같은 객체의 것이다
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
