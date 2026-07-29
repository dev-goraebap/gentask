package dev.goraebap.devkit.auth.application.recovery;

/**
 * 복구 흐름의 메일 발송 포트 (AUTH-07·08, MAIL-01).
 *
 * <p>가입 흐름과 마찬가지로 <b>계정이 없을 때도 무언가는 보낸다.</b> 아무것도 보내지 않으면
 * "메일이 왔는가"가 곧 "계정이 있는가"의 답이 되어, 화면에서 숨긴 정보가 메일함에서 새어 나간다
 * (인증.md 공통 규칙).
 */
public interface RecoveryMailer {

    /** 비밀번호 재설정 코드. */
    void sendPasswordResetOtp(String email, String code);

    /** 계정 복구(로그인) 코드. */
    void sendAccountRecoveryOtp(String email, String code);

    /**
     * 그 주소로 가입된 계정이 없을 때 보내는 안내. 코드를 담지 않는다.
     *
     * <p>본인이 요청했다면 "다른 주소로 가입했나" 하고 알아차리고, 요청하지 않았다면 누군가
     * 그 주소를 넣어봤다는 신호가 된다.
     */
    void sendNoAccountGuide(String email);

    /**
     * 비밀번호가 없는 소셜 전용 계정에 비밀번호 재설정을 요청했을 때의 안내 (AUTH-07 ↔ 08 교차).
     *
     * <p>재설정할 비밀번호가 없으므로 코드를 보내지 않고, 계정 복구 경로로 안내한다.
     */
    void sendNoPasswordGuide(String email);
}
