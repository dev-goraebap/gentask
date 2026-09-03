package xyz.gentask.shared.storage;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("보관소 접두어")
class StoragePropertiesTest {

    @Test
    @DisplayName("값이 없으면 버킷 루트를 쓴다")
    void 값이_없으면_버킷_루트를_쓴다() {
        assertThat(prefixOf(null)).isEmpty();
        assertThat(prefixOf("")).isEmpty();
        assertThat(prefixOf("   ")).isEmpty();
    }

    @Test
    @DisplayName("끝에 슬래시를 하나만 붙인다")
    void 끝에_슬래시를_하나만_붙인다() {
        assertThat(prefixOf("prod")).isEqualTo("prod/");
        assertThat(prefixOf("prod/")).isEqualTo("prod/");
        assertThat(prefixOf("prod//")).isEqualTo("prod/");
    }

    @Test
    @DisplayName("앞의 슬래시를 뗀다")
    void 앞의_슬래시를_뗀다() {
        assertThat(prefixOf("/qa")).isEqualTo("qa/");
        assertThat(prefixOf("/qa/")).isEqualTo("qa/");
        assertThat(prefixOf("//qa//")).isEqualTo("qa/");
    }

    @Test
    @DisplayName("슬래시만 있으면 버킷 루트를 쓴다")
    void 슬래시만_있으면_버킷_루트를_쓴다() {
        assertThat(prefixOf("/")).isEmpty();
        assertThat(prefixOf("///")).isEmpty();
    }

    private static String prefixOf(String keyPrefix) {
        return new StorageProperties("http://localhost", "auto", "key", "secret", "bucket", false, keyPrefix)
                .normalizedKeyPrefix();
    }
}
