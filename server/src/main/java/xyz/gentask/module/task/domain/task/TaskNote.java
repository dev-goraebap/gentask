package xyz.gentask.module.task.domain.task;

import xyz.gentask.shared.domain.ValueObject;
import xyz.gentask.shared.error.DomainRuleViolation;

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
