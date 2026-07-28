package dev.goraebap.devkit.mail;

/**
 * mail 모듈의 공개 API — 트랜잭션 이메일 발송 능력 (MAIL-01, 결정-0016).
 *
 * <p>계약:
 *
 * <ul>
 *   <li><b>비동기</b> — 호출자는 발송을 기다리지 않는다. 전용 executor에서 발송한다.
 *   <li><b>트랜잭션 커밋 이후 트리거</b> — 진행 중인 트랜잭션 안에서 호출되면 커밋 후에 발송한다.
 *       롤백되면 메일이 나가지 않는다.
 *   <li><b>실패는 호출자를 중단시키지 않는다</b> — 실패는 로그로 남고, 사용자 측 복구 수단은
 *       재발송(재발급)이다.
 * </ul>
 */
public interface MailSender {

    void send(MailMessage message);
}
