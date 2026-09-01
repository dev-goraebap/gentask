package xyz.gentask.module.tracker.domain.issue;

import xyz.gentask.shared.domain.ValueObject;
import xyz.gentask.shared.error.DomainRuleViolation;

/**
 * 작업 아이템의 본문. 마크다운 자유 서술이다.
 *
 * <p>인수 조건도 이 안의 관례로 적는다. 칸으로 강제하지 않는 것은 제목 하나만 남기려는 사람이 매번 그
 * 자리를 지나야 하기 때문이다. 관례는 결정-0007 이 갖는다.
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
