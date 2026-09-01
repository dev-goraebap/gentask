package xyz.gentask.module.tracker.domain.issue;

import xyz.gentask.shared.domain.ValueObject;
import xyz.gentask.shared.error.DomainRuleViolation;

public record IssueTitle(String value) implements ValueObject {

    public static final int MAX = 200;
    public static final String REQUIRED = "제목을 입력해 주세요";

    public static IssueTitle of(String rawTitle) {
        if (rawTitle == null || rawTitle.isBlank()) {
            throw new DomainRuleViolation(REQUIRED);
        }
        String strippedTitle = rawTitle.strip();
        if (strippedTitle.length() > MAX) {
            throw new DomainRuleViolation("제목은 " + MAX + "자를 넘을 수 없습니다");
        }
        return new IssueTitle(strippedTitle);
    }

    @Override
    public String toString() {
        return value;
    }
}
