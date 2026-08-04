package dev.goraebap.devkit.auth.application.sociallogin;

import dev.goraebap.devkit.auth.application.shared.SessionTransport;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/** 소셜 로그인 2단계의 요청·응답 DTO. 한 피쳐의 계약이므로 한 파일에 둔다. */
public final class SocialLoginRequests {

    private SocialLoginRequests() {}

    /**
     * 2단계 앞부분 — 이메일만 보낸다.
     *
     * <p>중간 표는 본문에 담지 않는다. 제공자 인증 직후 심어진 {@code HttpOnly} 쿠키로만 전달되며
     * 클라이언트는 그 값을 볼 수도 만질 수도 없다 (보안 검토 F1, {@link SocialTicketCookieFactory}).
     */
    public record EmailRequest(
            @NotBlank @Email @Size(max = 320) String email) {}

    /** 발급 응답 — 계정 존재 여부와 무관하게 같은 형태다(AUTH-05). */
    public record EmailResponse(UUID verificationId) {}

    /** 2단계 뒷부분 — 코드를 확인해 계정을 만든다. */
    public record ConfirmRequest(
            @NotNull UUID verificationId,
            @NotBlank @Pattern(regexp = "\\d{6}") String code,
            SessionTransport transport) {

        public SessionTransport transportOrDefault() {
            return transport == null ? SessionTransport.COOKIE : transport;
        }
    }
}
