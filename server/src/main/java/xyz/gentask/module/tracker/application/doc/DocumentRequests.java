package xyz.gentask.module.tracker.application.doc;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import xyz.gentask.module.tracker.domain.doc.DocumentBody;
import xyz.gentask.module.tracker.domain.doc.DocumentTitle;
import xyz.gentask.module.tracker.domain.doc.RevisionComment;

public final class DocumentRequests {

    private DocumentRequests() {}

    /** 세우는 것이 곧 첫 개정을 남기는 것이므로 본문을 여기서 함께 받는다(DOC-001). */
    public record CreateDocument(
            @NotBlank(message = DocumentTitle.REQUIRED) @Size(max = DocumentTitle.MAX) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String title,

            @Size(max = DocumentBody.MAX) @Schema(description = "적지 않으면 빈 본문으로 선다")
            String body) {}

    /**
     * 고치는 것은 제목과 본문 둘이며 개정 사유를 함께 받는다.
     *
     * <p>앞의 개정과 같은 것을 담으면 개정을 만들지 않는다(DOC-003 A2).
     */
    public record EditDocument(
            @NotBlank(message = DocumentTitle.REQUIRED) @Size(max = DocumentTitle.MAX) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String title,

            @Size(max = DocumentBody.MAX) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String body,

            @Size(max = RevisionComment.MAX) @Schema(
                    description = "왜 고쳤는지. 적지 않아도 된다",
                    types = {"string", "null"})
            String comment) {}

    /**
     * 되돌리기. 되돌아갈 개정은 주소가 담으므로 여기 담는 것은 왜 되돌리는지뿐이다.
     *
     * <p>적지 않아도 되며, 적지 않으면 몇 번째 개정으로 되돌렸는지를 시스템이 사유 자리에 적는다
     * (DOC-005 A3).
     */
    public record RevertRevision(
            @Size(max = RevisionComment.MAX) @Schema(
                    description = "왜 되돌리는지. 적지 않아도 된다",
                    types = {"string", "null"})
            String comment) {}
}
