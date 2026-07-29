package dev.goraebap.devkit.auth.application.recovery;

import dev.goraebap.devkit.auth.application.shared.SessionTransport;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/** 복구 흐름의 요청·응답 DTO 모음. 한 피쳐의 계약이므로 한 파일에 둔다. */
public final class RecoveryRequests {

    private RecoveryRequests() {}

    /** 재설정·복구 코드 발급 요청. 어느 쪽이든 이메일만 받는다. */
    public record IssueRequest(
            @NotBlank @Email @Size(max = 320) String email) {}

    /**
     * 발급 응답 — 계정 존재 여부와 무관하게 항상 같은 형태다.
     *
     * <p>계정이 없을 때도 식별자가 돌아온다. 그것으로 검증을 시도하면 "코드가 올바르지 않다"로
     * 끝나며, 클라이언트는 두 경우를 구분할 수 없다.
     */
    public record IssueResponse(UUID verificationId) {}

    /** 비밀번호 재설정 완료 요청. 비밀번호 상한 72는 bcrypt가 그 이상을 무시하기 때문이다. */
    public record ResetPasswordRequest(
            @NotNull UUID verificationId,
            @NotBlank @Pattern(regexp = "\\d{6}") String code,
            @NotBlank @Size(min = 8, max = 72) String newPassword) {}

    /** 계정 복구 로그인 요청. */
    public record RecoverLoginRequest(
            @NotNull UUID verificationId,
            @NotBlank @Pattern(regexp = "\\d{6}") String code,
            SessionTransport transport) {

        public SessionTransport transportOrDefault() {
            return transport == null ? SessionTransport.COOKIE : transport;
        }
    }
}
