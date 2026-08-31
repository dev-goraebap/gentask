package xyz.gentask.module.user.domain;

import java.util.Locale;
import java.util.regex.Pattern;
import xyz.gentask.shared.domain.ValueObject;
import xyz.gentask.shared.error.DomainRuleViolation;

public record Email(String value) implements ValueObject {

    public static final int MAX = 320;
    public static final String REQUIRED = "이메일을 입력해 주세요";
    public static final String MALFORMED = "이메일 형식이 아닙니다";

    private static final Pattern SHAPE = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

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

    public String normalized() {
        return value.toLowerCase(Locale.ROOT);
    }

    @Override
    public String toString() {
        return value;
    }
}
