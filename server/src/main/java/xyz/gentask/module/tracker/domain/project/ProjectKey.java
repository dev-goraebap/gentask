package xyz.gentask.module.tracker.domain.project;

import java.util.Locale;
import xyz.gentask.shared.domain.ValueObject;
import xyz.gentask.shared.error.DomainRuleViolation;

/**
 * 작업 항목 번호 접두어(Key) 값 객체다. 1~10자의 영문 대문자 및 숫자로 구성된다.
 */
public record ProjectKey(String value) implements ValueObject {

    public static final int MAX = 10;
    public static final String REQUIRED = "작업 아이템 접두어를 입력해 주세요";

    public static ProjectKey of(String rawKey) {
        if (rawKey == null || rawKey.isBlank()) {
            throw new DomainRuleViolation(REQUIRED);
        }
        String strippedKey = rawKey.strip().toUpperCase(Locale.ROOT);
        if (strippedKey.length() > MAX) {
            throw new DomainRuleViolation("작업 아이템 접두어는 " + MAX + "자를 넘을 수 없습니다");
        }
        for (char each : strippedKey.toCharArray()) {
            if (!isAllowed(each)) {
                throw new DomainRuleViolation("작업 아이템 접두어는 영문과 숫자만 쓸 수 있습니다");
            }
        }
        return new ProjectKey(strippedKey);
    }

    private static boolean isAllowed(char candidate) {
        return (candidate >= 'A' && candidate <= 'Z') || (candidate >= '0' && candidate <= '9');
    }

    @Override
    public String toString() {
        return value;
    }
}
