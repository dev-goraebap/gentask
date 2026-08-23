package dev.goraebap.refarch.module.task.domain;

import dev.goraebap.refarch.shared.error.DomainRuleViolation;

/**
 * 작업의 제목 (TK-001).
 *
 * <p>상수와 검증과 정규화와 문구가 이 한 자리에 모인다. 애그리거트에 두면 필드가 늘 때마다
 * 검증 메서드가 함께 늘어 도메인 로직이 그 사이에 파묻힌다.
 *
 * <p>여기 선언한 상수는 요청 DTO 가 참조한다. 검증은 두 번 실행되지만 <b>고칠 자리는 한 곳</b>이다.
 */
public record TaskTitle(String value) {

    public static final int MAX = 200;
    public static final String REQUIRED = "제목을 입력해 주세요";

    public TaskTitle {
        if (value == null || value.isBlank()) {
            throw new DomainRuleViolation(REQUIRED);
        }
        // 앞뒤 공백은 사용자가 의도한 제목이 아니다. 비교와 표시가 같은 값을 쓰도록 여기서 턴다.
        value = value.strip();
        if (value.length() > MAX) {
            throw new DomainRuleViolation("제목은 " + MAX + "자를 넘을 수 없습니다");
        }
    }

    @Override
    public String toString() {
        return value;
    }
}
