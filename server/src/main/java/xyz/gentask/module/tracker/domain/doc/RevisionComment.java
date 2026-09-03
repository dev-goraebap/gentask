package xyz.gentask.module.tracker.domain.doc;

import xyz.gentask.shared.domain.ValueObject;
import xyz.gentask.shared.error.DomainRuleViolation;

/**
 * 문서 개정 사유 값 객체다(최대 200자).
 */
public record RevisionComment(String value) implements ValueObject {

    public static final int MAX = 200;

    private static final RevisionComment NONE = new RevisionComment("");

    public static RevisionComment none() {
        return NONE;
    }

    public static RevisionComment of(String rawComment) {
        if (rawComment == null || rawComment.isBlank()) {
            return NONE;
        }
        String strippedComment = rawComment.strip();
        if (strippedComment.length() > MAX) {
            throw new DomainRuleViolation("개정 사유는 " + MAX + "자를 넘을 수 없습니다");
        }
        return new RevisionComment(strippedComment);
    }

    /**
     * 사유를 입력하지 않고 롤백을 수행한 경우 시스템이 자동 생성하는 기본 사유를 생성한다(DOC-005 A3).
     */
    public static RevisionComment revertedTo(int revisionNo) {
        return new RevisionComment(revisionNo + "번 개정으로 되돌림");
    }

    public boolean isPresent() {
        return !value.isEmpty();
    }

    /** 적지 않은 것을 표와 응답이 널로 받는다. */
    public String orNull() {
        return isPresent() ? value : null;
    }

    @Override
    public String toString() {
        return value;
    }
}
