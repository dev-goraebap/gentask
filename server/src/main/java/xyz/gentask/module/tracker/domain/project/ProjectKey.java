package xyz.gentask.module.tracker.domain.project;

import java.util.Locale;
import xyz.gentask.shared.domain.ValueObject;
import xyz.gentask.shared.error.DomainRuleViolation;

/**
 * 작업 아이템의 번호 앞에 붙는 접두어.
 *
 * <p>사용자가 고르는 것이 아니라 프로젝트 이름에서 뽑는다(PRJ-001). 번호가 매겨진 뒤에는 바꾸지
 * 않으므로 세울 때 한 번만 정한다.
 *
 * <p><b>영문 대문자와 숫자만 담는다.</b> 이 값이 주소에 그대로 들어가는데(`/projects/TG/issues`),
 * 그 밖의 글자는 퍼센트로 인코딩되어 링크를 복사해 붙이는 순간 읽을 수 없게 된다. 주소에 UUID 가
 * 아니라 접두어를 담기로 한 근거가 사람이 읽고 건넬 수 있다는 것이므로, 그 근거를 지키려면 담는
 * 글자를 여기서 좁혀야 한다. Jira · Linear · Plane 도 같은 자리를 같은 글자로 좁힌다.
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
        for (char each : strippedKey.toCharArray()) {
            if (!isAllowed(each)) {
                throw new DomainRuleViolation("프로젝트 접두어는 영문과 숫자만 쓸 수 있습니다");
            }
        }
        return new ProjectKey(strippedKey);
    }

    /**
     * 이름에서 접두어를 뽑는다.
     *
     * <p>영문과 숫자만 남긴 뒤 앞의 두 글자를 쓴다. 한글로만 지은 이름은 남는 것이 없으므로
     * {@code P} 를 받고, 겹치면 {@code P2} · {@code P3} 으로 이어진다. 이름과 이어지지 않는 것이
     * 이 선택이 치르는 대가이며, 주소가 읽히는 것을 그보다 앞에 두었다.
     */
    public static ProjectKey from(ProjectName name) {
        StringBuilder letters = new StringBuilder();
        for (char each : name.value().toUpperCase(Locale.ROOT).toCharArray()) {
            if (isAllowed(each)) {
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

    private static boolean isAllowed(char candidate) {
        return (candidate >= 'A' && candidate <= 'Z') || (candidate >= '0' && candidate <= '9');
    }

    @Override
    public String toString() {
        return value;
    }
}
