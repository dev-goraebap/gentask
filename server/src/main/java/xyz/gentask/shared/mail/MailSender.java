package xyz.gentask.shared.mail;

/**
 * 메일 발송 아웃바운드 포트 인터페이스다.
 *
 * 발송 실패 시 예외를 던져 즉시 실패를 전파한다(결정-0011).
 */
public interface MailSender {

    void send(String to, String subject, String body);
}
