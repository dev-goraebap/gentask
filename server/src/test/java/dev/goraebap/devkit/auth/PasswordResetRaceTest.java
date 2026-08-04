package dev.goraebap.devkit.auth;

import static dev.goraebap.devkit.jooq.Tables.ACCOUNTS;
import static dev.goraebap.devkit.jooq.Tables.SESSIONS;
import static dev.goraebap.devkit.jooq.Tables.USERS;
import static dev.goraebap.devkit.jooq.Tables.VERIFICATIONS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import dev.goraebap.devkit.IntegrationTestSupport;
import dev.goraebap.devkit.auth.application.recovery.RecoveryService;
import dev.goraebap.devkit.auth.application.registration.RegistrationService;
import dev.goraebap.devkit.auth.application.session.SessionService;
import dev.goraebap.devkit.auth.application.shared.ClientInfo;
import dev.goraebap.devkit.mail.MailMessage;
import dev.goraebap.devkit.mail.MailSender;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * 비밀번호를 <b>읽는 경로와 바꾸는 경로가 같은 행에서 줄을 서는지</b> 검증한다
 * (AUTH-07, 검토 #32-1).
 *
 * <p><b>막으려는 것</b>: 잠금이 없으면 READ COMMITTED에서 이렇게 된다.
 *
 * <pre>
 * 재설정 T1 ──[옛 해시 읽기]──[새 해시 쓰기]──[전 세션 삭제]──커밋
 * 로그인 T2 ─────[옛 해시 읽기]──[검증 통과]────────────────[세션 INSERT]──커밋
 *                                                              ↑ 삭제 대상에 없었다
 * </pre>
 *
 * <p>결과: <b>reset이 끝났는데도 옛 비밀번호로 만든 세션이 유효하다.</b> 비밀번호를 바꾸는 목적
 * 자체(지금 붙어 있는 접근을 끊는다)가 무너진다.
 *
 * <p><b>왜 결과가 아니라 잠금을 검증하는가.</b> 처음에는 재설정과 로그인을 동시에 던져 살아남은
 * 세션이 있는지 보는 방식으로 썼는데, <b>잠금을 지워도 통과했다</b> — 창이 수 밀리초라 확률적으로
 * 재현되지 않는다. 결함이 있는데도 통과하는 테스트는 없느니만 못하므로, 결과 대신 <b>메커니즘</b>을
 * 확인한다. 두 경로가 행을 잠그면 위 인터리빙 자체가 성립할 수 없다.
 *
 * <p>방법: 테스트가 먼저 credential 행을 잠근 채 붙들고, 그 동안 대상 경로가 <b>진행하지 못하는
 * 것</b>을 확인한다. 잠금을 풀면 완료된다. {@code for update}를 빼면 막히지 않고 바로 끝나므로
 * 이 테스트가 실패한다.
 */
@Import(PasswordResetRaceTest.RecordingMailConfig.class)
@TestPropertySource(
        properties = {
            "auth.otp.issue-ip-limit=1000",
            "auth.otp.issue-email-limit=1000",
            "auth.otp.confirm-ip-limit=1000",
            "auth.login.ip-limit=1000",
            "auth.login.account-limit=1000"
        })
class PasswordResetRaceTest extends IntegrationTestSupport {

    // 가입은 "확인 코드:", 재설정은 "비밀번호 재설정 코드:"를 쓴다 — 둘 다 잡는다
    private static final Pattern OTP_PATTERN = Pattern.compile("코드: (\\d{6})");
    private static final String EMAIL = "race-reset@example.com";
    private static final String OLD_PASSWORD = "old-password-1234";
    private static final String NEW_PASSWORD = "new-password-5678";
    private static final ClientInfo CLIENT = ClientInfo.of("203.0.113.10", "race");

    /** 이 시간 안에 끝나지 않으면 "잠금에 막혔다"로 본다. 잠금이 없으면 수 밀리초에 끝난다. */
    private static final long BLOCKED_MILLIS = 1500;

    @TestConfiguration
    static class RecordingMailConfig {
        static final List<MailMessage> SENT = new CopyOnWriteArrayList<>();

        @Bean
        @Primary
        MailSender recordingMailSender() {
            return SENT::add;
        }
    }

    @Autowired
    private RegistrationService registrationService;

    @Autowired
    private RecoveryService recoveryService;

    @Autowired
    private SessionService sessionService;

    @Autowired
    private DSLContext dsl;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @BeforeEach
    void 초기화() {
        RecordingMailConfig.SENT.clear();
        dsl.deleteFrom(VERIFICATIONS).execute();
        dsl.deleteFrom(SESSIONS).execute();
        dsl.deleteFrom(ACCOUNTS).execute();
        dsl.deleteFrom(USERS).execute();
    }

    @Test
    @DisplayName("AUTH-01 로그인은 credential 행을 잠그고 읽는다 — 재설정 중이면 기다린다")
    void 로그인이_credential_행을_잠근다() throws Exception {
        UUID userId = 가입한다();

        행을_잠근_채로(userId, () -> {
            CompletableFuture<?> login =
                    CompletableFuture.runAsync(() -> sessionService.login(EMAIL, OLD_PASSWORD, CLIENT));

            assertThatThrownBy(() -> login.get(BLOCKED_MILLIS, TimeUnit.MILLISECONDS))
                    .as("잠긴 행을 읽으려 하므로 진행하지 못해야 한다 — for update를 빼면 바로 끝난다")
                    .isInstanceOf(TimeoutException.class);
            return login;
        });
    }

    @Test
    @DisplayName("AUTH-07 비밀번호 재설정도 credential 행을 잠그고 읽는다")
    void 재설정이_credential_행을_잠근다() throws Exception {
        UUID userId = 가입한다();
        RecordingMailConfig.SENT.clear();
        UUID resetId = recoveryService.issuePasswordReset(EMAIL, "203.0.113.10");
        String resetCode = 마지막_코드();

        행을_잠근_채로(userId, () -> {
            CompletableFuture<?> reset = CompletableFuture.runAsync(
                    () -> recoveryService.completePasswordReset(resetId, resetCode, NEW_PASSWORD, "203.0.113.10"));

            assertThatThrownBy(() -> reset.get(BLOCKED_MILLIS, TimeUnit.MILLISECONDS))
                    .as("잠긴 행을 읽으려 하므로 진행하지 못해야 한다")
                    .isInstanceOf(TimeoutException.class);
            return reset;
        });
    }

    @Test
    @DisplayName("AUTH-07 재설정이 끝나면 옛 비밀번호로는 들어갈 수 없고 세션도 남지 않는다")
    void 재설정_후_옛_비밀번호가_통하지_않는다() {
        UUID userId = 가입한다();
        sessionService.login(EMAIL, OLD_PASSWORD, CLIENT);
        assertThat(dsl.fetchCount(SESSIONS, SESSIONS.USER_ID.eq(userId))).isPositive();

        RecordingMailConfig.SENT.clear();
        UUID resetId = recoveryService.issuePasswordReset(EMAIL, "203.0.113.10");
        recoveryService.completePasswordReset(resetId, 마지막_코드(), NEW_PASSWORD, "203.0.113.10");

        assertThat(dsl.fetchCount(SESSIONS, SESSIONS.USER_ID.eq(userId)))
                .as("reset은 전 세션을 끊는다")
                .isZero();
        assertThatThrownBy(() -> sessionService.login(EMAIL, OLD_PASSWORD, CLIENT))
                .as("옛 비밀번호는 더 이상 통하지 않는다")
                .isInstanceOf(Exception.class);
        assertThat(sessionService.login(EMAIL, NEW_PASSWORD, CLIENT)).isNotNull();
    }

    /**
     * credential 행을 {@code for update}로 잠근 트랜잭션을 붙들고 있는 동안 {@code probe}를 돌린다.
     * probe가 돌려준 pending은 잠금이 풀린 뒤 정상적으로 끝나야 한다 — 영영 막히는 것이 아니라
     * <b>기다렸다가 진행한다</b>는 것까지 확인해야 잠금이 올바르다.
     */
    private void 행을_잠근_채로(UUID userId, java.util.function.Supplier<CompletableFuture<?>> probe) throws Exception {
        CountDownLatch locked = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);

        CompletableFuture<Void> holder =
                CompletableFuture.runAsync(() -> transactionTemplate.executeWithoutResult(status -> {
                    dsl.selectFrom(ACCOUNTS)
                            .where(ACCOUNTS.USER_ID.eq(userId))
                            .forUpdate()
                            .fetch();
                    locked.countDown();
                    try {
                        release.await(20, TimeUnit.SECONDS);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }));

        assertThat(locked.await(10, TimeUnit.SECONDS)).as("행을 잠가야 한다").isTrue();
        try {
            CompletableFuture<?> pending = probe.get();
            release.countDown();
            pending.get(20, TimeUnit.SECONDS);
        } finally {
            release.countDown();
            holder.get(20, TimeUnit.SECONDS);
        }
    }

    private UUID 가입한다() {
        UUID verificationId = registrationService.issueSignupVerification(EMAIL, "203.0.113.10");
        registrationService.completeSignup(verificationId, 마지막_코드(), OLD_PASSWORD, CLIENT);
        return dsl.select(USERS.ID).from(USERS).fetchOne(USERS.ID);
    }

    /**
     * 메일은 <b>커밋 이후 비동기로</b> 나간다(결정-0016). 발송을 기다리지 않고 바로 읽으면
     * 아직 도착하지 않아 간헐적으로 실패한다 — 도착할 때까지 짧게 기다린다.
     */
    private String 마지막_코드() {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(5);
        while (System.nanoTime() < deadline) {
            for (int i = RecordingMailConfig.SENT.size() - 1; i >= 0; i--) {
                Matcher matcher =
                        OTP_PATTERN.matcher(RecordingMailConfig.SENT.get(i).text());
                if (matcher.find()) {
                    return matcher.group(1);
                }
            }
            try {
                Thread.sleep(20);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new AssertionError("코드를 기다리다 중단됐다", e);
            }
        }
        throw new AssertionError("발송된 메일에 코드가 없다");
    }
}
