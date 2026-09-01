package xyz.gentask.module.tracker.domain.project;

import xyz.gentask.shared.domain.ValueObject;
import xyz.gentask.shared.error.DomainRuleViolation;

public record ProjectName(String value) implements ValueObject {

    public static final int MAX = 100;
    public static final String REQUIRED = "프로젝트 이름을 입력해 주세요";

    public static ProjectName of(String rawName) {
        if (rawName == null || rawName.isBlank()) {
            throw new DomainRuleViolation(REQUIRED);
        }
        String strippedName = rawName.strip();
        if (strippedName.length() > MAX) {
            throw new DomainRuleViolation("프로젝트 이름은 " + MAX + "자를 넘을 수 없습니다");
        }
        return new ProjectName(strippedName);
    }

    @Override
    public String toString() {
        return value;
    }
}
