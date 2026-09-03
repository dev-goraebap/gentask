package xyz.gentask.module.tracker.domain.issue;

import xyz.gentask.shared.domain.ValueObject;
import xyz.gentask.shared.error.DomainRuleViolation;

/**
 * 작업 항목 마크다운 본문 값 객체다(최대 20,000자).
 *
 * 본문 내 체크리스트 규약으로 인수 조건을 기술한다(결정-0007).
 */
public record IssueBody(String value) implements ValueObject {

    public static final int MAX = 20_000;

    private static final IssueBody EMPTY = new IssueBody("");

    public static IssueBody empty() {
        return EMPTY;
    }

    public static IssueBody of(String rawBody) {
        if (rawBody == null) {
            return EMPTY;
        }
        if (rawBody.length() > MAX) {
            throw new DomainRuleViolation("본문은 " + MAX + "자를 넘을 수 없습니다");
        }
        return new IssueBody(rawBody);
    }

    @Override
    public String toString() {
        return value;
    }
}
