package xyz.gentask.module.tracker.domain.doc;

import xyz.gentask.shared.domain.ValueObject;
import xyz.gentask.shared.error.DomainRuleViolation;

/**
 * 폴더의 이름.
 *
 * <p>같은 부모 아래에 같은 이름이 있어도 막지 않는다. 폴더를 가리키는 것은 이름이 아니라 식별자이며,
 * 겹치는 것은 정리하면 될 일이지 세우는 자리에서 멈출 일이 아니다(DOC-008 A2).
 */
public record DocumentFolderName(String value) implements ValueObject {

    public static final int MAX = 200;
    public static final String REQUIRED = "이름을 입력해 주세요";

    public static DocumentFolderName of(String rawName) {
        if (rawName == null || rawName.isBlank()) {
            throw new DomainRuleViolation(REQUIRED);
        }
        String strippedName = rawName.strip();
        if (strippedName.length() > MAX) {
            throw new DomainRuleViolation("이름은 " + MAX + "자를 넘을 수 없습니다");
        }
        return new DocumentFolderName(strippedName);
    }

    @Override
    public String toString() {
        return value;
    }
}
