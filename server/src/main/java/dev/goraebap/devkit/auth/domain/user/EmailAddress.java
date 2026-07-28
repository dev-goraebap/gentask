package dev.goraebap.devkit.auth.domain.user;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * 이메일 값 객체 — 원문과 정규화된 값을 함께 든다 (결정-0015 §결정 5).
 *
 * <p>동일성 판정은 소문자화 + 앞뒤 공백 제거만 한다. <b>점 제거·플러스 태그 제거는 하지 않는다</b> —
 * Gmail은 같은 함으로 취급하지만 다른 제공자는 다른 주소로 취급하므로, 제거하면 남의 주소로
 * 가입되는 사고가 난다.
 */
public record EmailAddress(String raw, String normalized) {

    /** RFC 상한: 로컬파트 64 + '@' + 도메인 255. */
    private static final int MAX_LENGTH = 320;

    private static final Pattern FORMAT = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    public static EmailAddress of(String input) {
        if (input == null) {
            throw new IllegalArgumentException("이메일이 비어 있습니다");
        }
        String trimmed = input.strip();
        if (trimmed.isEmpty()
                || trimmed.length() > MAX_LENGTH
                || !FORMAT.matcher(trimmed).matches()) {
            throw new IllegalArgumentException("이메일 형식이 올바르지 않습니다");
        }
        return new EmailAddress(trimmed, trimmed.toLowerCase(Locale.ROOT));
    }
}
