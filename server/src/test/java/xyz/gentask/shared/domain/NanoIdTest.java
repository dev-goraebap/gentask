package xyz.gentask.shared.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

class NanoIdTest {
    @Test
    void 충돌하면_새_식별자로_다시_생성한다() {
        List<String> attempted = new ArrayList<>();
        String result = NanoId.create(id -> id, id -> {
            attempted.add(id);
            return attempted.size() == 2;
        });
        assertThat(attempted).hasSize(2).doesNotHaveDuplicates();
        assertThat(result).isEqualTo(attempted.getLast()).matches("[0-9A-Za-z_-]{12}");
    }

    @Test
    void 충돌이_계속되면_생성을_중단한다() {
        AtomicInteger attempts = new AtomicInteger();
        assertThatThrownBy(() -> NanoId.create(id -> id, id -> {
                    attempts.incrementAndGet();
                    return false;
                }))
                .isInstanceOf(IllegalStateException.class);
        assertThat(attempts.get()).isEqualTo(5);
    }

    @Test
    void UUID와_길이나_문자가_잘못된_식별자를_거절한다() {
        for (String value : new String[] {"00000000-0000-0000-0000-000000000000", "short", "invalid/id12"}) {
            assertThatThrownBy(() -> NanoId.requireValid(value)).isInstanceOf(IllegalArgumentException.class);
        }
        assertThat(NanoId.requireValid("0123ABCxyz-_")).isNotNull();
    }
}
