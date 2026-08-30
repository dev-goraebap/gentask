package dev.goraebap.refarch.shared.mail;

import dev.goraebap.refarch.shared.error.CommonErrorCode;
import java.io.UnsupportedEncodingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

/**
 * SMTP 로 보내는 구현.
 *
 * <p>시험은 이것을 {@code @Primary} 인 가짜로 덮는다. 그래서 실제로 나가는 경로는 어떤 자동
 * 검사도 지나지 않으며, 자격이 틀렸거나 형식이 거절되는 것은 보내 봐야 드러난다. 결정-0011 이
 * 그것을 감수 항목으로 적었다.
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
            // 사유를 로그에만 남긴다. 그대로 내보내면 받는 주소의 존재 여부가 응답에 실릴 수 있다.
            log.warn("메일을 보내지 못했다: {}", e.getMessage());
            throw CommonErrorCode.COMMON_MAIL_DELIVERY_FAILED.raise();
        }
    }
}
