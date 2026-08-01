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
 * <p>두 번째 갈래를 이어주는 손잡이는 이 타입에 담기지 않는다 — <b>서명된 중간 표</b>가 그 역할을
 * 하며, 표는 {@link SocialLoginService#issueTicket}이 따로 발급해 리다이렉트에 실린다. 표를 여기
 * 담지 않는 이유는 이 값이 리다이렉트로 나가는 것과 응답 본문으로 나가는 것 두 경로를 함께 타면
 * <b>어느 쪽이 자격증명인지가 흐려지기 때문</b>이다.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record SocialLoginOutcome(Status status, UUID userId, IssuedSession session) {

    public enum Status {
        SIGNED_IN,
        EMAIL_REQUIRED
    }

    public static SocialLoginOutcome signedIn(UUID userId, IssuedSession session) {
        return new SocialLoginOutcome(Status.SIGNED_IN, userId, session);
    }

    public static SocialLoginOutcome emailRequired() {
        return new SocialLoginOutcome(Status.EMAIL_REQUIRED, null, null);
    }
}
