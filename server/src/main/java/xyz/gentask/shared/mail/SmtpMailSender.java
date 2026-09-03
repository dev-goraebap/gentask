package xyz.gentask.shared.mail;

import java.io.UnsupportedEncodingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import xyz.gentask.shared.error.CommonErrorCode;

/**
 * SMTP 프로토콜 기반 메일 발송 구현체다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SmtpMailSender implements MailSender {

    private final JavaMailSender javaMailSender;
    private final MailProperties properties;

    @Override
    public void send(String to, String subject, String body) {
        try {
            var message = javaMailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(properties.from(), properties.fromName());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);
            javaMailSender.send(message);
        } catch (MailException | jakarta.mail.MessagingException | UnsupportedEncodingException e) {
            // 이메일 수신자 유효 여부 정보 유출을 방지하기 위해 상세 실패 사유는 내부 로그에만 기록한다.
            log.warn("메일을 보내지 못했다: {}", e.getMessage());
            throw CommonErrorCode.COMMON_MAIL_DELIVERY_FAILED.raise();
        }
    }
}
