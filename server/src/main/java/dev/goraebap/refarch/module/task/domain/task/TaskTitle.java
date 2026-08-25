package dev.goraebap.refarch.module.task.domain.task;

import dev.goraebap.refarch.shared.domain.ValueObject;
import dev.goraebap.refarch.shared.error.DomainRuleViolation;

public record TaskTitle(String value) implements ValueObject {

    public static final int MAX = 200;
    public static final String REQUIRED = "제목을 입력해 주세요";

    public static TaskTitle of(String rawTitle) {
        if (rawTitle == null || rawTitle.isBlank()) {
            throw new DomainRuleViolation(REQUIRED);
        }
        String strippedTitle = rawTitle.strip();
        if (strippedTitle.length() > MAX) {
            throw new DomainRuleViolation("제목은 " + MAX + "자를 넘을 수 없습니다");
        }
        return new TaskTitle(strippedTitle);
    }

    @Override
    public String toString() {
        return value;
    }
}
