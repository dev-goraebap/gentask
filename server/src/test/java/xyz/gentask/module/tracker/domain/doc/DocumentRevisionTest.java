package xyz.gentask.module.tracker.domain.doc;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class DocumentRevisionTest {

    private static final UUID 문서 = UUID.randomUUID();
    private static final UUID 사람 = UUID.randomUUID();
    private static final Instant 그때 = Instant.parse("2026-09-03T00:00:00Z");

    @Test
    void 첫_개정은_일번이다() {
        assertThat(첫_개정("제목", "본문").revisionNo()).isEqualTo(1);
    }

    @Test
    void 다음_개정은_번호가_하나_오른다() {
        DocumentRevision first = 첫_개정("제목", "본문");

        DocumentRevision second = first.next(
                UUID.randomUUID(),
                DocumentTitle.of("고친 제목"),
                DocumentBody.of("고친 본문"),
                RevisionComment.none(),
                사람,
                그때.plusSeconds(60));

        assertThat(second.revisionNo()).isEqualTo(2);
        assertThat(second.documentId()).isEqualTo(first.documentId());
    }

    @Test
    void 다음_개정을_내도_앞의_것은_그대로다() {
        DocumentRevision first = 첫_개정("제목", "본문");

        DocumentRevision second = first.next(
                UUID.randomUUID(),
                DocumentTitle.of("고친 제목"),
                DocumentBody.of("고친 본문"),
                RevisionComment.none(),
                사람,
                그때.plusSeconds(60));

        assertThat(second.title().value()).isEqualTo("고친 제목");
        assertThat(first.revisionNo()).isEqualTo(1);
        assertThat(first.title().value()).isEqualTo("제목");
        assertThat(first.body().value()).isEqualTo("본문");
    }

    @Test
    void 제목과_본문이_모두_같으면_같은_것이다() {
        DocumentRevision first = 첫_개정("제목", "본문");

        assertThat(first.hasSameContent(DocumentTitle.of("제목"), DocumentBody.of("본문")))
                .isTrue();
    }

    @Test
    void 본문만_달라도_다른_것이다() {
        DocumentRevision first = 첫_개정("제목", "본문");

        assertThat(first.hasSameContent(DocumentTitle.of("제목"), DocumentBody.of("본문 ")))
                .isFalse();
    }

    @Test
    void 제목만_달라도_다른_것이다() {
        DocumentRevision first = 첫_개정("제목", "본문");

        assertThat(first.hasSameContent(DocumentTitle.of("다른 제목"), DocumentBody.of("본문")))
                .isFalse();
    }

    private static DocumentRevision 첫_개정(String title, String body) {
        return DocumentRevision.first(
                UUID.randomUUID(), 문서, DocumentTitle.of(title), DocumentBody.of(body), RevisionComment.none(), 사람, 그때);
    }
}
