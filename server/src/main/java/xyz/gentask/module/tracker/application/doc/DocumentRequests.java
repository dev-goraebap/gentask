package xyz.gentask.module.tracker.application.doc;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import xyz.gentask.module.tracker.domain.doc.DocumentBody;
import xyz.gentask.module.tracker.domain.doc.DocumentFolderName;
import xyz.gentask.module.tracker.domain.doc.DocumentTitle;
import xyz.gentask.module.tracker.domain.doc.RevisionComment;

public final class DocumentRequests {

    private DocumentRequests() {}

    /** 세우는 것이 곧 첫 개정을 남기는 것이므로 본문을 여기서 함께 받는다(DOC-001). */
    public record CreateDocument(
            @NotBlank(message = DocumentTitle.REQUIRED) @Size(max = DocumentTitle.MAX) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String title,

            @Size(max = DocumentBody.MAX) @Schema(description = "적지 않으면 빈 본문으로 선다")
            String body,

            @Schema(
                    description = "담을 폴더. 적지 않으면 뿌리에 선다",
                    types = {"string", "null"},
                    format = "uuid")
            String folderId) {}

    /**
     * 문서를 옮긴다. 담길 자리만 담는다.
     *
     * 값이 없으면 뿌리다(DOC-006 A1). 자리를 비우는 것과 적지 않은 것을 가르지 않으므로 이 자리에
     * 널을 그대로 받는다.
     */
    public record MoveDocument(
            @Schema(
                    description = "담을 폴더. 값이 없으면 뿌리로 옮긴다",
                    types = {"string", "null"},
                    format = "uuid")
            String folderId) {}

    /** 폴더를 세운다. 담길 자리를 적지 않으면 뿌리에 선다. */
    public record CreateFolder(
            @NotBlank(message = DocumentFolderName.REQUIRED) @Size(max = DocumentFolderName.MAX) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String name,

            @Schema(
                    description = "담을 자리. 적지 않으면 뿌리에 선다",
                    types = {"string", "null"},
                    format = "uuid")
            String parentId) {}

    /** 폴더의 이름을 바꾼다. 이름을 바꿔도 그 폴더를 가리키던 길은 끊기지 않는다(DOC-008 A4). */
    public record RenameFolder(
            @NotBlank(message = DocumentFolderName.REQUIRED) @Size(max = DocumentFolderName.MAX) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String name) {}

    /**
     * 폴더를 옮긴다. 담긴 문서와 하위 폴더는 이 폴더를 가리키고 있으므로 함께 간다(DOC-008 A5).
     *
     * 값이 없으면 최상위다.
     */
    public record MoveFolder(
            @Schema(
                    description = "옮길 자리. 값이 없으면 최상위로 옮긴다",
                    types = {"string", "null"},
                    format = "uuid")
            String parentId) {}

    /**
     * 고치는 것은 제목과 본문 둘이며 개정 사유를 함께 받는다.
     *
     * 앞의 개정과 같은 것을 담으면 개정을 만들지 않는다(DOC-003 A2).
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
     * 적지 않아도 되며, 적지 않으면 몇 번째 개정으로 되돌렸는지를 시스템이 사유 자리에 적는다
     * (DOC-005 A3).
     */
    public record RevertRevision(
            @Size(max = RevisionComment.MAX) @Schema(
                    description = "왜 되돌리는지. 적지 않아도 된다",
                    types = {"string", "null"})
            String comment) {}
}
