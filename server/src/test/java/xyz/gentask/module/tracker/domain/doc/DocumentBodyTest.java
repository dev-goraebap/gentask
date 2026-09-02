package xyz.gentask.module.tracker.domain.doc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import xyz.gentask.shared.error.DomainRuleViolation;

class DocumentBodyTest {

    @Test
    void 널은_빈_본문이다() {
        assertThat(DocumentBody.of(null).value()).isEmpty();
    }

    @Test
    void 앞뒤_공백을_털지_않는다() {
        assertThat(DocumentBody.of("  들여쓴 줄\n").value()).isEqualTo("  들여쓴 줄\n");
    }

    @Test
    void 상한과_같으면_받는다() {
        String exact = "가".repeat(DocumentBody.MAX);
        assertThat(DocumentBody.of(exact).value()).hasSize(DocumentBody.MAX);
    }

    @Test
    void 상한을_넘으면_거부한다() {
        String tooLong = "가".repeat(DocumentBody.MAX + 1);
        assertThatThrownBy(() -> DocumentBody.of(tooLong)).isInstanceOf(DomainRuleViolation.class);
    }

    /** 이 저장소의 가장 긴 문서가 21,238 자다. 작업 아이템의 상한(20,000)으로는 그것이 들어가지 못한다. */
    @Test
    void 이만_자를_넘는_문서를_받는다() {
        String longest = "가".repeat(21_238);
        assertThat(DocumentBody.of(longest).value()).hasSize(21_238);
    }

    @Test
    void 같은_본문은_같은_지문을_낸다() {
        assertThat(DocumentBody.of("한 줄").sha1())
                .isEqualTo(DocumentBody.of("한 줄").sha1());
    }

    @Test
    void 다른_본문은_다른_지문을_낸다() {
        assertThat(DocumentBody.of("한 줄").sha1())
                .isNotEqualTo(DocumentBody.of("한 줄 ").sha1());
    }

    @Test
    void 지문은_열여섯_진수_마흔_자다() {
        assertThat(DocumentBody.empty().sha1()).hasSize(40).matches("[0-9a-f]{40}");
    }
}
