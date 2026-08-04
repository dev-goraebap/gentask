package dev.goraebap.devkit.auth.application.sociallogin;

import dev.goraebap.devkit.auth.application.shared.TokenHasher;
import dev.goraebap.devkit.auth.domain.account.AuthProvider;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import lombok.RequiredArgsConstructor;

/**
 * 중간 상태 표를 문자열로 만들고 되돌린다 (AUTH-02·03).
 *
 * <p>형식은 {@code base64url(provider|providerAccountId|만료시각).서명}이다. 서명은 앱 시크릿을
 * 키로 하는 HMAC이므로, 앞부분을 고쳐 다른 사람의 제공자 계정인 척하면 서명이 맞지 않는다.
 *
 * <p>수명을 10분으로 짧게 두는 이유: 이 표는 "이메일을 입력하는 동안"만 살아 있으면 된다.
 * 길게 두면 제공자 인증 한 번으로 얻은 표를 오래 재사용할 수 있게 된다.
 */
@RequiredArgsConstructor
public class PendingSocialTicketCodec {

    /** 이메일 입력에 필요한 만큼만. */
    public static final Duration TTL = Duration.ofMinutes(10);

    private static final String FIELD_SEPARATOR = "|";
    private static final String SIGNATURE_SEPARATOR = ".";

    private final TokenHasher tokenHasher;
    private final Clock clock;

    public String encode(AuthProvider provider, String providerAccountId) {
        Instant expiresAt = clock.instant().plus(TTL);
        String payload =
                provider.value() + FIELD_SEPARATOR + providerAccountId + FIELD_SEPARATOR + expiresAt.toEpochMilli();
        String encoded =
                Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        return encoded + SIGNATURE_SEPARATOR + tokenHasher.hmac(encoded);
    }

    /** 서명이 맞고 만료 전이면 표를 돌려준다. 아니면 비어 있다 — 사유를 구분해 알려주지 않는다. */
    public Optional<PendingSocialTicket> decode(String ticket) {
        if (ticket == null) {
            return Optional.empty();
        }
        int cut = ticket.lastIndexOf(SIGNATURE_SEPARATOR);
        if (cut <= 0) {
            return Optional.empty();
        }
        String encoded = ticket.substring(0, cut);
        String signature = ticket.substring(cut + 1);
        if (!constantTimeEquals(tokenHasher.hmac(encoded), signature)) {
            return Optional.empty();
        }
        try {
            String payload = new String(Base64.getUrlDecoder().decode(encoded), StandardCharsets.UTF_8);
            String[] parts = payload.split("\\" + FIELD_SEPARATOR, 3);
            if (parts.length != 3) {
                return Optional.empty();
            }
            PendingSocialTicket decoded = new PendingSocialTicket(
                    AuthProvider.fromValue(parts[0]), parts[1], Instant.ofEpochMilli(Long.parseLong(parts[2])));
            return decoded.isExpired(clock.instant()) ? Optional.empty() : Optional.of(decoded);
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    /** 서명 비교에서 타이밍을 흘리지 않는다. */
    private static boolean constantTimeEquals(String a, String b) {
        if (a.length() != b.length()) {
            return false;
        }
        int diff = 0;
        for (int i = 0; i < a.length(); i++) {
            diff |= a.charAt(i) ^ b.charAt(i);
        }
        return diff == 0;
    }
}
