package dev.goraebap.refarch.module.task.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import dev.goraebap.refarch.shared.error.DomainRuleViolation;
import org.junit.jupiter.api.Test;

/**
 * 값 객체의 불변식을 검증한다. 컨텍스트 없이 도는 것이 이 계층의 조건이다.
 *
 * <p>슬라이스 식별자를 붙이지 않는다. 함수 하나의 검증이 성공 조건을 이름으로 가지면 그 경로가
 * 닫혔다는 거짓 주장이 된다.
 */
class TaskTitleTest {

    @Test
    void 앞뒤_공백을_턴다() {
        assertThat(TaskTitle.of("  장 보기  ").value()).isEqualTo("장 보기");
    }

    @Test
    void 비어_있으면_제목이_아니다() {
        assertThatThrownBy(() -> TaskTitle.of(""))
                .isInstanceOf(DomainRuleViolation.class)
                .hasMessage(TaskTitle.REQUIRED);
    }

    @Test
    void 공백만_있는_것도_제목이_아니다() {
        assertThatThrownBy(() -> TaskTitle.of("   ")).isInstanceOf(DomainRuleViolation.class);
    }

    @Test
    void 널도_제목이_아니다() {
        assertThatThrownBy(() -> TaskTitle.of(null)).isInstanceOf(DomainRuleViolation.class);
    }

    @Test
    void 상한을_넘으면_거부한다() {
        String tooLong = "가".repeat(TaskTitle.MAX + 1);
        assertThatThrownBy(() -> TaskTitle.of(tooLong)).isInstanceOf(DomainRuleViolation.class);
    }

    @Test
    void 상한과_같으면_받는다() {
        String exact = "가".repeat(TaskTitle.MAX);
        assertThat(TaskTitle.of(exact).value()).hasSize(TaskTitle.MAX);
    }

    /**
     * 저장소가 재구성할 때 쓰는 경로다. 규칙을 강화한 뒤에도 옛 데이터가 읽혀야 하므로
     * 검증하지 않는다.
     */
    @Test
    void 정규_생성자는_검증하지_않는다() {
        String tooLong = "가".repeat(TaskTitle.MAX + 1);
        assertThat(new TaskTitle(tooLong).value()).hasSize(TaskTitle.MAX + 1);
    }
}
