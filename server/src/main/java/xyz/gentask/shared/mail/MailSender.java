package xyz.gentask.shared.mail;

/**
 * 메일을 실제로 내보내는 포트. 구현은 이 패키지가 갖는다.
 *
 * <p>보내지 못하면 예외로 끝낸다. {@code PushSender} 가 결과를 값으로 내는 것과 다른데, 푸시는
 * 스케줄러가 뒤에서 돌며 실패를 기록으로 남기는 반면 메일은 사용자가 코드를 기다리는 중이라 그
 * 요청이 실패로 끝나야 다시 시도할 수 있기 때문이다. 근거는 결정-0011.
 */
public interface MailSender {

    void send(String to, String subject, String body);
}
