package dev.goraebap.refarch.module.task.domain;

import dev.goraebap.refarch.shared.domain.ValueObject;
import dev.goraebap.refarch.shared.error.DomainRuleViolation;

/**
 * 제목만으로는 담기지 않는 맥락 (TK-003).
 *
 * <p>비어 있는 것이 기본 상태이며 {@code null} 을 그것과 같게 다룬다. 두 상태를 나누면 "메모가
 * 없다" 와 "메모가 빈 문자열이다" 를 구분해야 하는데, 사용자에게 그 둘은 같은 것이다.
 *
 * <p>바깥에서 들어온 값은 {@link #of(String)} 으로 만든다. 정규 생성자는 저장소가 재구성할 때만
 * 쓰며 검증하지 않는다({@link ValueObject}).
 */
public record TaskNote(String value) implements ValueObject {

    public static final int MAX = 2000;

    public static TaskNote of(String raw) {
        String value = raw == null ? "" : raw;
        if (value.length() > MAX) {
            throw new DomainRuleViolation("메모는 " + MAX + "자를 넘을 수 없습니다");
        }
        return new TaskNote(value);
    }

    public static TaskNote empty() {
        return new TaskNote("");
    }

    @Override
    public String toString() {
        return value;
    }
}
