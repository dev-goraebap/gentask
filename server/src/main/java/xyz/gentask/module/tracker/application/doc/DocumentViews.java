package xyz.gentask.module.tracker.application.doc;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

public final class DocumentViews {

    private DocumentViews() {}

    /**
     * 목록의 한 줄.
     *
     * <p>본문을 담지 않는다. 제목과 고친 때는 문서가 앞당겨 들고 있으므로 개정을 잇지 않는다.
     */
    @Schema(name = "DocumentSummary")
    public record DocumentSummary(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            UUID id,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String title,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, format = "date-time")
            Instant createdAt,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, format = "date-time")
            Instant updatedAt) {}

    @Schema(name = "DocumentView")
    public record DocumentView(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            DocumentSummary summary,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "지금 참인 개정의 본문. 마크다운 원문이다")
            String body,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "지금 참인 개정의 번호. 1부터 매긴다")
            int revisionNo,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "세운 사람의 별명")
            String authorName) {}
}
