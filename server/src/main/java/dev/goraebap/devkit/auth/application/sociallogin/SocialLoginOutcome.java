package dev.goraebap.devkit.auth.application.sociallogin;

import com.fasterxml.jackson.annotation.JsonInclude;
import dev.goraebap.devkit.auth.application.session.IssuedSession;
import java.util.UUID;

/**
 * 제공자 인증을 마친 뒤의 갈림길 (AUTH-02·03·05).
 *
 * <p>세 갈래뿐이다.
 *
 * <ul>
 *   <li>{@code SIGNED_IN} — 이미 이 제공자 신원으로 만든 계정이 있다. 바로 로그인된다
 *   <li>{@code EMAIL_REQUIRED} — 처음 보는 신원이다. 이메일을 입력받아 OTP로 소유를 증명해야 한다
 * </ul>
 *
 * <p>{@code pendingSocialId}는 두 번째 갈래에서 이어지는 손잡이다. <b>이것만으로는 아무것도 할 수
 * 없다</b> — 이메일 입력과 OTP를 거쳐야 계정이 생긴다.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record SocialLoginOutcome(Status status, UUID userId, IssuedSession session, UUID pendingSocialId) {

    public enum Status {
        SIGNED_IN,
        EMAIL_REQUIRED
    }

    public static SocialLoginOutcome signedIn(UUID userId, IssuedSession session) {
        return new SocialLoginOutcome(Status.SIGNED_IN, userId, session, null);
    }

    public static SocialLoginOutcome emailRequired(UUID pendingSocialId) {
        return new SocialLoginOutcome(Status.EMAIL_REQUIRED, null, null, pendingSocialId);
    }
}
