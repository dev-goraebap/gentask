package dev.goraebap.refarch.module.task.domain;

import dev.goraebap.refarch.shared.domain.ValueObject;
import dev.goraebap.refarch.shared.error.DomainRuleViolation;

/** 작업의 제목 (TK-001). */
public record TaskTitle(String value) implements ValueObject {

    public static final int MAX = 200;
    public static final String REQUIRED = "제목을 입력해 주세요";

    /** 검증하고 정규화해 만든다. */
    public static TaskTitle of(String rawTitle) {
        if (rawTitle == null || rawTitle.isBlank()) {
            throw new DomainRuleViolation(REQUIRED);
        }
        // 앞뒤 공백은 사용자가 의도한 제목이 아니므로 턴다.
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
