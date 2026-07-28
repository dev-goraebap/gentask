package dev.goraebap.devkit.mail.infrastructure.smtp;

import dev.goraebap.devkit.mail.MailMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Gmail SMTP로 실제 발송한다 (결정-0016).
 *
 * <p>전용 executor에서 비동기로 돌며, 짧은 재시도 후 실패를 로그로 남긴다 — 발송 실패가 호출한
 * 유스케이스를 중단시키지 않는다(MAIL-01). 본문(OTP 코드 포함)은 로그에 남기지 않는다.
 */
@Slf4j
@Component
class SmtpMailDispatcher {

    private static final int MAX_ATTEMPTS = 2;

    private final JavaMailSender javaMailSender;
    private final MailFromProperties properties;

    SmtpMailDispatcher(JavaMailSender javaMailSender, MailFromProperties properties) {
        this.javaMailSender = javaMailSender;
        this.properties = properties;
    }

    @Async("mailExecutor")
    public void dispatch(MailMessage message) {
        SimpleMailMessage smtpMessage = new SimpleMailMessage();
        smtpMessage.setFrom(properties.from());
        smtpMessage.setTo(message.to());
        smtpMessage.setSubject(message.subject());
        smtpMessage.setText(message.text());

        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                javaMailSender.send(smtpMessage);
                return;
            } catch (MailException e) {
                if (attempt == MAX_ATTEMPTS) {
                    log.error("메일 발송 실패 (수신자={}) — 복구 수단은 재발송이다", mask(message.to()), e);
                } else {
                    log.warn("메일 발송 재시도 {}/{} (수신자={})", attempt, MAX_ATTEMPTS, mask(message.to()));
                }
            }
        }
    }

    /** 로그에 이메일 원문을 남기지 않는다 — SMTP 장애 시 가입자 목록이 로그로 새는 경로가 된다. */
    private static String mask(String email) {
        int at = email.indexOf('@');
        return at <= 1 ? "***" + email.substring(at) : email.charAt(0) + "***" + email.substring(at);
    }
}
