package dev.goraebap.devkit.auth;

import static dev.goraebap.devkit.jooq.Tables.ACCOUNTS;
import static dev.goraebap.devkit.jooq.Tables.SESSIONS;
import static dev.goraebap.devkit.jooq.Tables.USERS;
import static dev.goraebap.devkit.jooq.Tables.VERIFICATIONS;
import static org.assertj.core.api.Assertions.assertThat;

import dev.goraebap.devkit.IntegrationTestSupport;
import dev.goraebap.devkit.auth.application.registration.RegistrationService;
import dev.goraebap.devkit.auth.application.shared.ClientInfo;
import dev.goraebap.devkit.auth.domain.verification.Verification;
import dev.goraebap.devkit.mail.MailMessage;
import dev.goraebap.devkit.mail.MailSender;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
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

/**
 * OTP 시도 횟수 제한이 <b>동시 요청 아래에서도</b> 지켜지는지 검증한다 (AUTH-06, 결정-0015 §결정 3).
 *
 * <p>이 테스트가 지키는 것은 코드가 아니라 <b>행 잠금</b>이다. 검증 경로가
 * {@code findForAttempt}(select ... for update)가 아니라 잠금 없는 조회로 되돌아가면, 동시 요청들이
 * 서로의 시도 횟수 증가를 덮어써(lost update) 5회 제한이 무력화된다. 그러면 공격자가 같은 대기
 * 레코드에 코드를 병렬로 대입해 10⁶ 공간을 탐색할 수 있고, 소유하지 않은 이메일로 계정을 얻는다.
 *
 * <p>잠금이 없으면 {@code attempts}가 1~2에 머물러 이 테스트가 실패한다.
 */
@Import(OtpConcurrencyTest.RecordingMailConfig.class)
@TestPropertySource(
        properties = {
            "auth.otp.issue-ip-limit=1000",
            "auth.otp.issue-email-limit=1000",
            // 레코드 단위 제한(5회)만 남기고 요청 빈도 제한은 비켜둔다 — 여기서 보려는 것은 잠금이다
            "auth.otp.confirm-ip-limit=1000"
        })
class OtpConcurrencyTest extends IntegrationTestSupport {

    private static final Pattern OTP_PATTERN = Pattern.compile("확인 코드: (\\d{6})");
    private static final int PARALLEL_ATTEMPTS = 12;

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
    private DSLContext dsl;

    @BeforeEach
    void 초기화() {
        RecordingMailConfig.SENT.clear();
        dsl.deleteFrom(VERIFICATIONS).execute();
        dsl.deleteFrom(SESSIONS).execute();
        dsl.deleteFrom(ACCOUNTS).execute();
        dsl.deleteFrom(USERS).execute();
    }

    @Test
    @DisplayName("AUTH-06 같은 대기 레코드에 오답을 동시에 던져도 시도 횟수가 유실되지 않는다 (결정-0015)")
    void 동시_오답_시도가_유실되지_않는다() throws Exception {
        UUID verificationId = registrationService.issueSignupVerification("race@example.com", "203.0.113.10");
        String wrongCode = wrongCode();

        AtomicInteger rejected = new AtomicInteger();
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(PARALLEL_ATTEMPTS);

        try (ExecutorService pool = Executors.newFixedThreadPool(PARALLEL_ATTEMPTS)) {
            for (int i = 0; i < PARALLEL_ATTEMPTS; i++) {
                pool.execute(() -> {
                    try {
                        start.await();
                        registrationService.completeSignup(
                                verificationId, wrongCode, "password-1234", ClientInfo.of("203.0.113.10", "race"));
                    } catch (Exception e) {
                        rejected.incrementAndGet();
                    } finally {
                        done.countDown();
                    }
                });
            }
            start.countDown();
            assertThat(done.await(30, TimeUnit.SECONDS)).as("모든 시도가 끝나야 한다").isTrue();
        }

        assertThat(rejected).as("오답은 전부 거부된다").hasValue(PARALLEL_ATTEMPTS);
        assertThat(dsl.fetchCount(USERS)).as("오답만 던졌으므로 사용자가 생기지 않는다").isZero();

        Integer attempts = dsl.select(VERIFICATIONS.ATTEMPTS)
                .from(VERIFICATIONS)
                .where(VERIFICATIONS.ID.eq(verificationId))
                .fetchOne(VERIFICATIONS.ATTEMPTS);
        assertThat(attempts).as("시도 횟수가 상한에서 멈춰야 한다 — 잠금이 없으면 덮어쓰기로 1~2에 머문다").isEqualTo(Verification.MAX_ATTEMPTS);
    }

    @Test
    @DisplayName("AUTH-01 정답을 동시에 던져도 계정은 하나만 생긴다 — 1회용이 동시성 아래에서도 지켜진다")
    void 동시_정답_시도에도_계정은_하나만_생긴다() throws Exception {
        UUID verificationId = registrationService.issueSignupVerification("once@example.com", "203.0.113.10");
        String code = issuedCode();

        AtomicInteger succeeded = new AtomicInteger();
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(PARALLEL_ATTEMPTS);

        try (ExecutorService pool = Executors.newFixedThreadPool(PARALLEL_ATTEMPTS)) {
            for (int i = 0; i < PARALLEL_ATTEMPTS; i++) {
                pool.execute(() -> {
                    try {
                        start.await();
                        registrationService.completeSignup(
                                verificationId, code, "password-1234", ClientInfo.of("203.0.113.10", "race"));
                        succeeded.incrementAndGet();
                    } catch (Exception e) {
                        // 나머지는 소진된 코드로 거부된다
                    } finally {
                        done.countDown();
                    }
                });
            }
            start.countDown();
            assertThat(done.await(30, TimeUnit.SECONDS)).as("모든 시도가 끝나야 한다").isTrue();
        }

        assertThat(succeeded).as("코드는 1회용이다").hasValue(1);
        assertThat(dsl.fetchCount(USERS)).isEqualTo(1);
        assertThat(dsl.fetchCount(ACCOUNTS)).isEqualTo(1);
    }

    private String issuedCode() {
        MailMessage last = RecordingMailConfig.SENT.get(RecordingMailConfig.SENT.size() - 1);
        Matcher matcher = OTP_PATTERN.matcher(last.text());
        assertThat(matcher.find()).as("메일 본문에 OTP 코드가 있어야 한다").isTrue();
        return matcher.group(1);
    }

    private String wrongCode() {
        String code = issuedCode();
        return code.equals("000000") ? "000001" : "000000";
    }
}
