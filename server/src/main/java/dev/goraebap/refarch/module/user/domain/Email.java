package dev.goraebap.refarch.module.user.domain;

import dev.goraebap.refarch.shared.domain.ValueObject;
import dev.goraebap.refarch.shared.error.DomainRuleViolation;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * 계정의 이메일 (TK-005).
 *
 * 적은 그대로의 값을 갖고, 비교와 유일성은 정규화 값(normalized)이 담당한다. 대소문자만
 * 다른 두 계정을 사람은 같은 주소로 읽는다.
 */
public record Email(String value) implements ValueObject {

    public static final int MAX = 320;
    public static final String REQUIRED = "이메일을 입력해 주세요";
    public static final String MALFORMED = "이메일 형식이 아닙니다";

    // RFC 전체를 좇지 않는다. 로컬@도메인.최상위 꼴만 확인하며, 진짜 검증은 그 주소로
    // 실제 메일이 오가는 순간에만 가능하다.
    private static final Pattern SHAPE = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    /** 검증하고 앞뒤 공백을 털어 만든다. */
    public static Email of(String rawEmail) {
        if (rawEmail == null || rawEmail.isBlank()) {
            throw new DomainRuleViolation(REQUIRED);
        }
        String strippedEmail = rawEmail.strip();
        if (strippedEmail.length() > MAX || !SHAPE.matcher(strippedEmail).matches()) {
            throw new DomainRuleViolation(MALFORMED);
        }
        return new Email(strippedEmail);
    }

    /** 비교 · 유일성 · 자격 조회에 쓰는 값이다. */
    public String normalized() {
        return value.toLowerCase(Locale.ROOT);
    }

    @Override
    public String toString() {
        return value;
    }
}
