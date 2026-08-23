package dev.goraebap.refarch.shared.error;

/**
 * 들어온 값이 도메인 규칙에 맞지 않는다는 실패.
 *
 * 여기 넣은 문장은 응답의 detail 에 그대로 실린다. 사용자가 읽을 문장이어야 하며 내부 정보를
 * 담지 않는다. 사용자에게 보일 일이 없는 위반은 IllegalStateException 으로 던진다.
 */
public class DomainRuleViolation extends RuntimeException {

    public DomainRuleViolation(String message) {
        super(message);
    }
}
