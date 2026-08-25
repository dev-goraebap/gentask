package dev.goraebap.refarch.module.task.domain.task;

import dev.goraebap.refarch.shared.domain.ValueObject;
import dev.goraebap.refarch.shared.error.DomainRuleViolation;

/**
 * 제목만으로는 담기지 않는 맥락 (TK-003).
 *
 * 사용자에게 "메모가 없다" 와 "메모가 비었다" 는 같으므로 null 을 빈 문자열과 같게 다룬다.
 */
public record TaskNote(String value) implements ValueObject {

    public static final int MAX = 2000;

    public static TaskNote of(String rawNote) {
        String noteValue = rawNote == null ? "" : rawNote;
        if (noteValue.length() > MAX) {
            throw new DomainRuleViolation("메모는 " + MAX + "자를 넘을 수 없습니다");
        }
        return new TaskNote(noteValue);
    }

    public static TaskNote empty() {
        return new TaskNote("");
    }

    @Override
    public String toString() {
        return value;
    }
}
