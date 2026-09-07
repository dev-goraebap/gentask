package xyz.gentask.module.artifact.application.artifact;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import xyz.gentask.module.artifact.domain.artifact.ArtifactBody;
import xyz.gentask.module.artifact.domain.artifact.ArtifactTitle;
import xyz.gentask.module.artifact.domain.artifact.RevisionComment;
import xyz.gentask.module.artifact.domain.folder.ArtifactFolderName;

public final class ArtifactRequests {

    private ArtifactRequests() {}

    /** 세우는 것이 곧 첫 버전을 남기는 것이므로 본문을 여기서 함께 받는다(DOC-001). */
    public record CreateArtifact(
            @NotBlank(message = ArtifactTitle.REQUIRED) @Size(max = ArtifactTitle.MAX) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String title,

            @Size(max = ArtifactBody.MAX) @Schema(description = "적지 않으면 빈 본문으로 선다")
            String body,

            @Schema(
                    description = "담을 폴더. 적지 않으면 뿌리에 선다",
                    types = {"string", "null"},
                    minLength = 12,
                    maxLength = 12,
                    pattern = "[0-9A-Za-z_-]{12}")
            String folderId) {}

    /**
     * 아티팩트를 옮긴다. 담길 자리만 담는다.
     *
     * 값이 없으면 뿌리다(DOC-006 A1). 자리를 비우는 것과 적지 않은 것을 가르지 않으므로 이 자리에
     * 널을 그대로 받는다.
     */
    public record MoveArtifact(
            @Schema(
                    description = "담을 폴더. 값이 없으면 뿌리로 옮긴다",
                    types = {"string", "null"},
                    format = "uuid")
            String folderId) {}

    /** 폴더를 세운다. 담길 자리를 적지 않으면 뿌리에 선다. */
    public record CreateFolder(
            @NotBlank(message = ArtifactFolderName.REQUIRED) @Size(max = ArtifactFolderName.MAX) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String name,

            @Schema(
                    description = "담을 자리. 적지 않으면 뿌리에 선다",
                    types = {"string", "null"},
                    format = "uuid")
            String parentId) {}

    /** 폴더의 이름을 바꾼다. 이름을 바꿔도 그 폴더를 가리키던 길은 끊기지 않는다(DOC-008 A4). */
    public record RenameFolder(
            @NotBlank(message = ArtifactFolderName.REQUIRED) @Size(max = ArtifactFolderName.MAX) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String name) {}

    /**
     * 폴더를 옮긴다. 담긴 아티팩트와 하위 폴더는 이 폴더를 가리키고 있으므로 함께 간다(DOC-008 A5).
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
     * 고치는 것은 제목과 본문 둘이며 버전 사유를 함께 받는다.
     *
     * 앞의 버전과 같은 것을 담으면 버전을 만들지 않는다(DOC-003 A2).
     */
    public record EditArtifact(
            @NotBlank(message = ArtifactTitle.REQUIRED) @Size(max = ArtifactTitle.MAX) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String title,

            @Size(max = ArtifactBody.MAX) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String body,

            @Size(max = RevisionComment.MAX) @Schema(
                    description = "왜 고쳤는지. 적지 않아도 된다",
                    types = {"string", "null"})
            String comment) {}

    /**
     * 되돌리기. 되돌아갈 버전은 주소가 담으므로 여기 담는 것은 왜 되돌리는지뿐이다.
     *
     * 적지 않아도 되며, 적지 않으면 몇 번째 버전으로 되돌렸는지를 시스템이 사유 자리에 적는다
     * (DOC-005 A3).
     */
    public record RevertVersion(
            @Size(max = RevisionComment.MAX) @Schema(
                    description = "왜 되돌리는지. 적지 않아도 된다",
                    types = {"string", "null"})
            String comment) {}
}
