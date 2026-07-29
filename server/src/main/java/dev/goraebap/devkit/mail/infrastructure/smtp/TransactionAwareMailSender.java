package dev.goraebap.devkit.mail.infrastructure.smtp;

import dev.goraebap.devkit.mail.MailMessage;
import dev.goraebap.devkit.mail.MailSender;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * 발송 시점을 트랜잭션 커밋 이후로 미룬다 (MAIL-01, 결정-0016 §결정 3).
 *
 * <p>트랜잭션 안에서 보내면 롤백 시 유령 코드가 나간다 — OTP 메일이 갔는데 대기 레코드가 없는
 * 상태. 진행 중인 트랜잭션이 없으면 즉시 위임한다.
 */
@Component
@RequiredArgsConstructor
class TransactionAwareMailSender implements MailSender {

    private final SmtpMailDispatcher dispatcher;

    @Override
    public void send(MailMessage message) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    dispatcher.dispatch(message);
                }
            });
        } else {
            dispatcher.dispatch(message);
        }
    }
}
