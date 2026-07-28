package dev.goraebap.devkit.auth.application.shared;

import dev.goraebap.devkit.common.ErrorCode;

/**
 * auth 모듈의 에러 코드 (설계/서버.md §1.4·§1.6).
 *
 * <p>OTP 오류는 사유를 구분하되 열거 가능성을 만들지 않는다 — 존재하지 않는 대기 레코드와 틀린
 * 코드는 같은 {@code AUTH_OTP_INVALID}다.
 */
public enum AuthErrorCode implements ErrorCode {
    AUTH_UNAUTHENTICATED(401, "인증이 필요합니다"),
    AUTH_INVALID_CREDENTIALS(401, "인증 정보가 올바르지 않습니다"),
    AUTH_FORBIDDEN_ORIGIN(403, "허용되지 않은 출처의 요청입니다"),
    AUTH_OTP_INVALID(400, "확인 코드가 올바르지 않습니다"),
    AUTH_OTP_EXPIRED(400, "확인 코드가 만료되었습니다"),
    AUTH_OTP_ATTEMPTS_EXCEEDED(400, "확인 코드 시도 횟수를 초과했습니다"),
    AUTH_OTP_RATE_LIMITED(429, "요청이 너무 잦습니다"),
    AUTH_EMAIL_ALREADY_USED(409, "이미 가입된 이메일입니다");

    private final int status;
    private final String title;

    AuthErrorCode(int status, String title) {
        this.status = status;
        this.title = title;
    }

    @Override
    public String code() {
        return name();
    }

    @Override
    public int status() {
        return status;
    }

    @Override
    public String title() {
        return title;
    }
}
