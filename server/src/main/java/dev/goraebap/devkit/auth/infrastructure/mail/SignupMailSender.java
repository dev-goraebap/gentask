package dev.goraebap.devkit.auth.infrastructure.mail;

import dev.goraebap.devkit.auth.application.registration.SignupMailer;
import dev.goraebap.devkit.auth.domain.verification.Verification;
import dev.goraebap.devkit.mail.MailMessage;
import dev.goraebap.devkit.mail.MailSender;
import org.springframework.stereotype.Component;

/**
 * 가입 메일 어댑터 — mail 모듈의 공개 API로 위임한다 (MAIL-01).
 *
 * <p>본문은 서버가 생성한 값(코드·고정 문구)만으로 조립한다. 사용자 입력(이메일 주소)은 수신자
 * 필드에만 쓰이고 본문·제목에 섞이지 않는다 — 인젝션 방지의 가장 단순한 형태다.
 */
@Component
class SignupMailSender implements SignupMailer {

    private static final String SUBJECT = "[웹앱 개발키트] 이메일 확인 안내";

    private static final String OTP_BODY_TEMPLATE = """
            안녕하세요.

            이메일 확인 코드: {code}

            이 코드는 {minutes}분 동안 유효합니다.
            요청하지 않았다면 이 코드를 누구에게도 알려주지 마세요.
            """;

    private static final String EXISTING_ACCOUNT_BODY = """
            안녕하세요.

            이 주소로 이미 가입된 계정이 있어 확인 코드를 보내지 않았습니다.
            기존에 쓰던 로그인 방법으로 로그인해 주세요.

            본인이 요청하지 않았다면 이 메일은 무시해도 됩니다.
            """;

    private final MailSender mailSender;

    SignupMailSender(MailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendOtp(String email, String code) {
        String body = OTP_BODY_TEMPLATE
                .replace("{code}", code)
                .replace("{minutes}", String.valueOf(Verification.TTL.toMinutes()));
        mailSender.send(new MailMessage(email, SUBJECT, body));
    }

    @Override
    public void sendExistingAccountGuide(String email) {
        mailSender.send(new MailMessage(email, SUBJECT, EXISTING_ACCOUNT_BODY));
    }
}
