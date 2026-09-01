package xyz.gentask.module.tracker.domain.project;

import java.util.Locale;
import xyz.gentask.shared.domain.ValueObject;
import xyz.gentask.shared.error.DomainRuleViolation;

/**
 * 작업 아이템의 번호 앞에 붙는 접두어.
 *
 * <p>사용자가 고르는 것이 아니라 프로젝트 이름에서 뽑는다(PRJ-001). 번호가 매겨진 뒤에는 바꾸지
 * 않으므로 세울 때 한 번만 정한다.
 */
public record ProjectKey(String value) implements ValueObject {

    public static final int MAX = 10;

    /** 이름에서 뽑을 것이 하나도 없을 때 쓴다. 비어 있는 접두어를 두느니 이것이 낫다. */
    private static final String FALLBACK = "P";

    public static ProjectKey of(String rawKey) {
        if (rawKey == null || rawKey.isBlank()) {
            throw new DomainRuleViolation("프로젝트 접두어가 비어 있습니다");
        }
        String strippedKey = rawKey.strip().toUpperCase(Locale.ROOT);
        if (strippedKey.length() > MAX) {
            throw new DomainRuleViolation("프로젝트 접두어는 " + MAX + "자를 넘을 수 없습니다");
        }
        return new ProjectKey(strippedKey);
    }

    /**
     * 이름에서 접두어를 뽑는다.
     *
     * <p>글자와 숫자만 남긴 뒤 앞의 두 글자를 쓴다. 한글 이름은 한 글자가 이미 뜻을 가지므로 한 글자만
     * 남아도 접두어가 된다. 남는 것이 없으면 {@code P} 다.
     */
    public static ProjectKey from(ProjectName name) {
        StringBuilder letters = new StringBuilder();
        for (char each : name.value().toCharArray()) {
            if (Character.isLetterOrDigit(each)) {
                letters.append(each);
            }
            if (letters.length() == 2) {
                break;
            }
        }
        return of(letters.isEmpty() ? FALLBACK : letters.toString());
    }

    /**
     * 겹치지 않을 때까지 뒤에 숫자를 붙인 것을 낸다.
     *
     * <p>되묻지 않는 것은 접두어가 사용자가 고른 것이 아니기 때문이다(PRJ-001 A2).
     */
    public ProjectKey withSuffix(int suffix) {
        String tail = String.valueOf(suffix);
        String head = value.length() + tail.length() > MAX ? value.substring(0, MAX - tail.length()) : value;
        return of(head + tail);
    }

    @Override
    public String toString() {
        return value;
    }
}
