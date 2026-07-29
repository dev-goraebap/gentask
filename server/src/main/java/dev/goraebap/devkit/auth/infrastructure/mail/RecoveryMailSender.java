package dev.goraebap.devkit.auth.infrastructure.mail;

import dev.goraebap.devkit.auth.application.recovery.RecoveryMailer;
import dev.goraebap.devkit.auth.domain.verification.Verification;
import dev.goraebap.devkit.mail.MailMessage;
import dev.goraebap.devkit.mail.MailSender;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 복구 메일 어댑터 (AUTH-07·08, MAIL-01).
 *
 * <p>네 종류의 메일이 <b>같은 제목</b>을 쓴다. 제목만 보고 계정이 있는지, 비밀번호가 있는지
 * 알 수 없어야 하기 때문이다 — 메일함을 어깨너머로 보는 경우까지 고려한 것이다. 실제 분기는
 * 본문에만 있다.
 *
 * <p>본문은 서버가 만든 값(코드·고정 문구)으로만 조립한다. 사용자 입력은 수신자 필드에만 쓰인다.
 */
@Component
@RequiredArgsConstructor
class RecoveryMailSender implements RecoveryMailer {

    private static final String SUBJECT = "[웹앱 개발키트] 계정 접근 안내";

    private static final String PASSWORD_RESET_TEMPLATE = """
            안녕하세요.

            비밀번호 재설정 코드: {code}

            이 코드는 {minutes}분 동안 유효합니다.
            재설정을 마치면 모든 기기에서 로그아웃되며, 새 비밀번호로 다시 로그인해야 합니다.

            요청하지 않았다면 이 코드를 누구에게도 알려주지 마세요.
            """;

    private static final String ACCOUNT_RECOVERY_TEMPLATE = """
            안녕하세요.

            계정 복구 코드: {code}

            이 코드는 {minutes}분 동안 유효합니다.
            로그인한 뒤에는 비밀번호를 설정하거나 소셜 계정을 다시 연결해 두세요.

            요청하지 않았다면 이 코드를 누구에게도 알려주지 마세요.
            """;

    private static final String NO_ACCOUNT_BODY = """
            안녕하세요.

            이 주소로 가입된 계정을 찾지 못해 코드를 보내지 않았습니다.
            다른 주소로 가입하셨는지 확인해 주세요.

            본인이 요청하지 않았다면 이 메일은 무시해도 됩니다.
            """;

    private static final String NO_PASSWORD_BODY = """
            안녕하세요.

            이 계정에는 비밀번호가 설정되어 있지 않아 재설정할 것이 없습니다.
            소셜 계정으로 로그인하시거나, 그것도 어려우시면 계정 복구를 이용해 주세요.

            본인이 요청하지 않았다면 이 메일은 무시해도 됩니다.
            """;

    private static final String RECOVERY_LOGIN_NOTICE_BODY = """
            안녕하세요.

            방금 계정 복구로 로그인되었습니다.

            본인이 아니라면 지금 바로 비밀번호를 재설정해 주세요.
            재설정하면 모든 기기에서 로그아웃되고 대기 중인 코드도 함께 취소됩니다.
            """;

    private final MailSender mailSender;

    @Override
    public void sendPasswordResetOtp(String email, String code) {
        mailSender.send(new MailMessage(email, SUBJECT, render(PASSWORD_RESET_TEMPLATE, code)));
    }

    @Override
    public void sendAccountRecoveryOtp(String email, String code) {
        mailSender.send(new MailMessage(email, SUBJECT, render(ACCOUNT_RECOVERY_TEMPLATE, code)));
    }

    @Override
    public void sendNoAccountGuide(String email) {
        mailSender.send(new MailMessage(email, SUBJECT, NO_ACCOUNT_BODY));
    }

    @Override
    public void sendNoPasswordGuide(String email) {
        mailSender.send(new MailMessage(email, SUBJECT, NO_PASSWORD_BODY));
    }

    @Override
    public void sendRecoveryLoginNotice(String email) {
        mailSender.send(new MailMessage(email, SUBJECT, RECOVERY_LOGIN_NOTICE_BODY));
    }

    private static String render(String template, String code) {
        return template.replace("{code}", code).replace("{minutes}", String.valueOf(Verification.TTL.toMinutes()));
    }
}
