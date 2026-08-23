package dev.goraebap.refarch.shared.error;

/**
 * 들어온 값이 도메인 규칙에 맞지 않는다는 실패.
 *
 * <p>이 타입이 따로 있는 이유는 <b>핸들러가 우리가 던진 것과 라이브러리가 던진 것을 구분하기
 * 위해서</b>다. {@code IllegalArgumentException} 을 쓰면 둘이 섞여 올라오고, 구분하지 못하면
 * 안전한 쪽으로 전부 덮어써야 해서 도메인이 쓴 문구가 매번 버려진다.
 *
 * <p><b>여기 넣은 문장은 응답의 {@code detail} 에 그대로 실린다.</b> 사용자가 읽을 문장이어야
 * 하며 내부 정보를 담지 않는다. 사용자에게 보일 일이 없는 위반은 {@code IllegalStateException}
 * 으로 던져 500 으로 나가게 한다.
 *
 * <p>HTTP 도 프레임워크도 알지 못하므로 도메인 계층이 참조해도 된다.
 */
public class DomainRuleViolation extends RuntimeException {

    public DomainRuleViolation(String message) {
        super(message);
    }
}
