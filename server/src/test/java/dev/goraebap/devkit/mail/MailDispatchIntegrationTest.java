package dev.goraebap.devkit.mail;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import dev.goraebap.devkit.IntegrationTestSupport;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * 발송 파이프라인의 계약을 검증한다 (MAIL-01, 결정-0016).
 *
 * <p>다른 테스트들은 {@code MailSender}를 통째로 가짜로 바꾸므로 이 경로를 지나가지 않는다.
 * 여기서는 <b>진짜 {@code MailSender} 빈</b>을 쓰고 그 아래 SMTP 계층만 가짜로 바꿔,
 * 트랜잭션 연동·비동기·실패 격리 세 가지가 실제로 작동하는지 본다.
 *
 * <p>이 테스트가 없으면 {@code TransactionAwareMailSender}를 지워도 어떤 테스트도 실패하지 않는다 —
 * 롤백 시 유령 OTP가 나가는 회귀가 조용히 되살아난다.
 */
@Import(MailDispatchIntegrationTest.FakeSmtpConfig.class)
class MailDispatchIntegrationTest extends IntegrationTestSupport {

    private static final MailMessage MESSAGE = new MailMessage("user@example.com", "제목", "본문");

    /**
     * SMTP 전송만 가로챈다. {@link JavaMailSenderImpl}을 상속하는 이유는 {@code SmtpMailDispatcher}가
     * 주입받는 타입이 {@link JavaMailSender}이고, 그 위의 {@code TransactionAwareMailSender}·
     * {@code SmtpMailDispatcher}는 <b>진짜 빈</b>을 그대로 쓰기 위해서다.
     */
    static class FakeJavaMailSender extends JavaMailSenderImpl {
        final List<SimpleMailMessage> sent = new CopyOnWriteArrayList<>();
        final List<String> threadNames = new CopyOnWriteArrayList<>();
        final AtomicInteger failuresToRaise = new AtomicInteger();
        final AtomicInteger sendAttempts = new AtomicInteger();
        volatile CountDownLatch latch = new CountDownLatch(1);

        @Override
        public void send(SimpleMailMessage... messages) {
            sendAttempts.incrementAndGet();
            threadNames.add(Thread.currentThread().getName());
            try {
                if (failuresToRaise.getAndUpdate(remaining -> Math.max(0, remaining - 1)) > 0) {
                    throw new MailSendException("의도된 발송 실패");
                }
                sent.addAll(List.of(messages));
            } finally {
                latch.countDown();
            }
        }

        void reset(int expectedCalls) {
            sent.clear();
            threadNames.clear();
            sendAttempts.set(0);
            failuresToRaise.set(0);
            latch = new CountDownLatch(expectedCalls);
        }

        boolean awaitDispatch() throws InterruptedException {
            return latch.await(5, TimeUnit.SECONDS);
        }
    }

    @TestConfiguration
    static class FakeSmtpConfig {
        @Bean
        @Primary
        FakeJavaMailSender fakeJavaMailSender() {
            return new FakeJavaMailSender();
        }
    }

    @Autowired
    private MailSender mailSender;

    @Autowired
    private FakeJavaMailSender smtp;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @BeforeEach
    void 초기화() {
        smtp.reset(1);
    }

    @Test
    @DisplayName("MAIL-01 트랜잭션이 롤백되면 메일이 나가지 않는다 (결정-0016)")
    void 롤백되면_발송되지_않는다() throws Exception {
        assertThatThrownBy(() -> transactionTemplate.executeWithoutResult(status -> {
                    mailSender.send(MESSAGE);
                    throw new IllegalStateException("의도된 롤백");
                }))
                .isInstanceOf(IllegalStateException.class);

        // 발송이 일어났다면 5초 안에 latch가 풀린다 — 풀리지 않아야 정상이다
        assertThat(smtp.awaitDispatch()).as("롤백된 트랜잭션의 메일은 발송되지 않는다").isFalse();
        assertThat(smtp.sent).isEmpty();
    }

    @Test
    @DisplayName("MAIL-01 발송은 트랜잭션 커밋 이후에 트리거된다 (결정-0016)")
    void 커밋_이후에_발송된다() throws Exception {
        transactionTemplate.executeWithoutResult(status -> {
            mailSender.send(MESSAGE);
            // 커밋 전에는 아직 SMTP로 내려가지 않았다
            assertThat(smtp.sendAttempts).as("커밋 전에는 발송되지 않는다").hasValue(0);
        });

        assertThat(smtp.awaitDispatch()).as("커밋 후에는 발송된다").isTrue();
        assertThat(smtp.sent).hasSize(1);
        assertThat(smtp.sent.get(0).getTo()).containsExactly("user@example.com");
    }

    @Test
    @DisplayName("MAIL-01 발송은 전용 executor에서 비동기로 처리된다 (결정-0016)")
    void 전용_executor에서_비동기로_발송된다() throws Exception {
        mailSender.send(MESSAGE);

        assertThat(smtp.awaitDispatch()).isTrue();
        // 호출 스레드가 아니라 mail- 접두어 스레드에서 돈다 — @Async와 mailExecutor 배선이 살아 있다는 뜻
        assertThat(smtp.threadNames).allSatisfy(name -> assertThat(name).startsWith("mail-"));
    }

    @Test
    @DisplayName("MAIL-01 발송 실패는 호출한 유스케이스를 중단시키지 않는다")
    void 발송_실패가_호출자를_중단시키지_않는다() throws Exception {
        smtp.reset(2);
        smtp.failuresToRaise.set(2);

        // 호출 자체는 예외 없이 끝난다 — 실패는 로그로만 남는다
        transactionTemplate.executeWithoutResult(status -> mailSender.send(MESSAGE));

        assertThat(smtp.awaitDispatch()).isTrue();
        assertThat(smtp.sendAttempts).as("짧은 재시도 후 포기한다").hasValue(2);
        assertThat(smtp.sent).isEmpty();
    }
}
