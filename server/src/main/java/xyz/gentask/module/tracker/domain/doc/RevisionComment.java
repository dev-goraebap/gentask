package xyz.gentask.module.tracker.domain.doc;

import xyz.gentask.shared.domain.ValueObject;
import xyz.gentask.shared.error.DomainRuleViolation;

/**
 * 왜 고쳤는지. 적지 않아도 된다.
 *
 * <p>비어 있는 것과 적지 않은 것을 가르지 않는다. 둘을 가르면 표에 빈 문자열과 널이 함께 쌓이고,
 * 사유가 있는지를 묻는 자리마다 두 가지를 다 보아야 한다(DOC-003 A3).
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
     * 되돌리면서 이유를 적지 않았을 때 시스템이 스스로 적는 사유(DOC-005 A3).
     *
     * <p>이력에서 되돌린 자리를 알아볼 수 있어야 하므로 몇 번째 개정으로 되돌렸는지를 담는다.
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
