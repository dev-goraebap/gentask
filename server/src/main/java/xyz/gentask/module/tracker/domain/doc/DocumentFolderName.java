package xyz.gentask.module.tracker.domain.doc;

import xyz.gentask.shared.domain.ValueObject;
import xyz.gentask.shared.error.DomainRuleViolation;

/**
 * 문서 폴더 이름 값 객체다(최대 200자).
 *
 * 동일 상위 폴더 하위에 동일한 이름의 폴더가 존재해도 허용한다(DOC-008 A2).
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
