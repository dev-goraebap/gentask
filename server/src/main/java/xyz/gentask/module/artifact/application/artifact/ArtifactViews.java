package xyz.gentask.module.artifact.application.artifact;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;

public final class ArtifactViews {

    private ArtifactViews() {}

    /**
     * 폴더 목록의 한 줄.
     *
     * 계층을 서버가 조립하지 않는다. 평평한 목록에 담긴 자리를 실어 내며 트리로 세우는 것은 읽는
     * 쪽이 한다 — 깊이를 제한하지 않으므로(DOC-008) 조립한 모양은 한 화면에 담기지 않고, 무엇을
     * 펼쳐 둘지는 보는 자리가 안다.
     *
     * 담긴 것의 수를 함께 낸다. 지우기 전에 몇이 한 단계 위로 올라가는지 되묻는 자리가 이 값을
     * 쓴다(DOC-008 A7).
     */
    @Schema(name = "ArtifactFolderSummary")
    public record FolderSummary(
            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    minLength = 12,
                    maxLength = 12,
                    pattern = "[0-9A-Za-z_-]{12}")
            String id,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String name,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    types = {"string", "null"},
                    minLength = 12,
                    maxLength = 12,
                    pattern = "[0-9A-Za-z_-]{12}",
                    description = "담긴 자리. 값이 없으면 뿌리에 선다")
            String parentId,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "바로 아래에 담긴 아티팩트 수")
            int artifactCount,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "바로 아래에 담긴 폴더 수")
            int folderCount,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, format = "date-time")
            Instant createdAt,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, format = "date-time")
            Instant updatedAt) {}

    /**
     * 목록의 한 줄.
     *
     * 본문을 담지 않는다. 제목과 고친 때는 아티팩트가 앞당겨 들고 있으므로 버전을 잇지 않는다.
     */
    @Schema(name = "ArtifactSummary")
    public record ArtifactSummary(
            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    minLength = 12,
                    maxLength = 12,
                    pattern = "[0-9A-Za-z_-]{12}")
            String id,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String title,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    types = {"string", "null"},
                    minLength = 12,
                    maxLength = 12,
                    pattern = "[0-9A-Za-z_-]{12}",
                    description = "담긴 폴더. 값이 없으면 뿌리에 선다")
            String folderId,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, format = "date-time")
            Instant createdAt,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, format = "date-time")
            Instant updatedAt) {}

    @Schema(name = "ArtifactView")
    public record ArtifactView(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            ArtifactSummary summary,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "지금 참인 버전의 본문. 마크다운 원문이다")
            String body,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "지금 참인 버전의 번호. 1부터 매긴다")
            int versionNo,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "세운 사람의 별명")
            String authorName,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "최종 수정자의 닉네임")
            String lastEditorName) {}

    /**
     * 이력의 한 줄.
     *
     * 본문을 싣지 않는다. 이력은 언제 누가 왜 고쳤는지를 훑는 자리이고, 본문은 버전 하나를 고른 뒤에
     * 낸다(DOC-004).
     */
    @Schema(name = "VersionSummary")
    public record VersionSummary(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "아티팩트 안의 버전 번호. 1부터 매긴다")
            int versionNo,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, format = "date-time")
            Instant createdAt,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "남긴 사람의 별명")
            String authorName,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    types = {"string", "null"},
                    description = "왜 고쳤는지. 적지 않았으면 값이 없다")
            String comment) {}

    /** 이력 한 쪽. 최근 것부터 담는다(DOC-004 A3). */
    @Schema(name = "VersionPageView")
    public record VersionPageView(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            List<VersionSummary> items,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "이 아티팩트의 버전 전체 수")
            long total,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "0부터 매긴 쪽 번호")
            int page,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "한 쪽에 담은 수")
            int size) {

        /** 담아 온 목록을 그대로 쥐지 않는다. 부르는 쪽이 뒤에 고치면 이 값이 함께 바뀐다. */
        public VersionPageView {
            items = List.copyOf(items);
        }
    }

    /**
     * 버전 하나.
     *
     * 그때의 제목과 본문을 그대로 낸다. 두 버전의 차이는 서버가 계산하지 않으며 견주는 일은 읽는
     * 쪽이 한다(DOC-004).
     */
    @Schema(name = "VersionView")
    public record VersionView(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            VersionSummary summary,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "그때의 제목")
            String title,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "그때의 본문. 마크다운 원문이다")
            String body) {}
}
