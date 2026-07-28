package dev.goraebap.devkit.auth.application.registration;

/**
 * 가입 흐름의 메일 발송 포트. 구현은 infrastructure/mail — 도메인·피쳐는 발송 수단을 모른다
 * (MAIL-01).
 *
 * <p>두 메일의 <b>응답 형태는 동일해야</b> 한다 — 어느 쪽이 갔는지는 메일함 주인만 안다. 계정
 * 존재 여부를 화면으로 노출하지 않는 규칙(인증.md 공통 규칙)의 발송 측 절반이다.
 */
public interface SignupMailer {

    /** 신규 이메일 — OTP 코드를 보낸다. */
    void sendOtp(String email, String code);

    /** 기존 계정의 이메일 — 코드를 보내지 않고 로그인 안내를 보낸다 (AUTH-05). */
    void sendExistingAccountGuide(String email);
}
