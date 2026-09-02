package xyz.gentask.module.tracker.domain.project;

import java.util.Locale;
import xyz.gentask.shared.domain.ValueObject;
import xyz.gentask.shared.error.DomainRuleViolation;

/**
 * 작업 아이템의 번호 앞에 붙는 접두어.
 *
 * <p><b>사람이 정한다.</b> 이름에서 뽑지 않는다 — 뽑는 규칙을 두면 한글로만 지은 이름에서 남는 것이
 * 없어 `P` 같은 뜻 없는 값이 나오고, 그 값이 커밋의 `Refs: P-43` 으로 박힌다. 이 값은 주소에
 * 쓰이지 않으므로(주소는 {@link ProjectPublicId} 가 갖는다) 사람이 고를 자유가 있다.
 *
 * <p><b>겹쳐도 막지 않는다.</b> 해석은 주소의 식별자가 하므로 접두어가 같아도 서버가 헷갈릴 자리가
 * 없다. 겹치지 않는 것을 뽑아 주던 자리도 함께 걷었다.
 *
 * <p>영문 대문자와 숫자만 담는 것은 남았다. 이 값이 이슈 이름으로 커밋 메시지와 테스트 이름에
 * 박히는데, 거기서 낱말과 섞이지 않으려면 모양이 좁아야 한다.
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
