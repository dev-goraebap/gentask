package xyz.gentask.module.artifact.application.folder;

import io.modelcontextprotocol.common.McpTransportContext;
import io.modelcontextprotocol.spec.McpSchema.CallToolResult;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.mcp.annotation.McpTool;
import org.springframework.ai.mcp.annotation.McpTool.McpAnnotations;
import org.springframework.ai.mcp.annotation.McpToolParam;
import org.springframework.stereotype.Component;
import xyz.gentask.module.artifact.application.artifact.ArtifactRequests;
import xyz.gentask.shared.mcp.McpResults;

@Component
@RequiredArgsConstructor
public class FolderMcpTools {
    private final ArtifactFolderService folders;
    private final McpResults results;
    private final xyz.gentask.module.artifact.application.ArtifactResources resources;

    @McpTool(
            name = "list_artifact_folders",
            description = "프로젝트의 폴더 목록과 parentId를 조회한다. parentId가 null이면 최상위 폴더다.",
            annotations = @McpAnnotations(readOnlyHint = true, destructiveHint = false, openWorldHint = false))
    public CallToolResult listFolders(
            McpTransportContext context,
            @McpToolParam(description = "프로젝트 NanoID. 생성 시 소속 지정. 개별 항목은 ID로 소속을 확인", required = false)
                    String projectId,
            @McpToolParam(description = "personal: 개인만. 생략: 전체. projectId와 함께 사용할 수 없음", required = false)
                    String scope) {
        return results.call(() -> resources.folders(results.userId(context), projectId, scope));
    }

    @McpTool(
            name = "create_artifact_folder",
            description = "아티팩트 폴더를 생성한다. parentId를 생략하면 최상위에 생성한다. 같은 이름도 허용되므로 먼저 목록을 확인한다.",
            annotations = @McpAnnotations(destructiveHint = false, openWorldHint = false))
    public CallToolResult createFolder(
            McpTransportContext context,
            @McpToolParam(description = "프로젝트 NanoID. 생성 시 소속 지정. 개별 항목은 ID로 소속을 확인", required = false)
                    String projectId,
            @McpToolParam(description = "폴더 이름", required = true) String name,
            @McpToolParam(description = "상위 폴더 NanoID", required = false) String parentId) {
        return results.call(() -> {
            var request = results.validate(new ArtifactRequests.CreateFolder(name, parentId));
            return Map.of("id", folders.add(results.userId(context), projectId, request.name(), request.parentId()));
        });
    }

    @McpTool(
            name = "rename_artifact_folder",
            description = "폴더 이름을 변경한다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = false, openWorldHint = false))
    public CallToolResult renameArtifactFolder(
            McpTransportContext context,
            @McpToolParam(description = "프로젝트 NanoID. 생성 시 소속 지정. 개별 항목은 ID로 소속을 확인", required = false)
                    String projectId,
            @McpToolParam(description = "폴더 NanoID", required = true) String folderId,
            @McpToolParam(description = "name", required = true) String name) {
        return results.call(() -> {
            var r = results.validate(new ArtifactRequests.RenameFolder(name));
            folders.rename(
                    results.userId(context),
                    resources.folderProject(results.userId(context), folderId, projectId),
                    folderId,
                    r.name());
            return Map.of("saved", true);
        });
    }

    @McpTool(
            name = "move_artifact_folder",
            description = "폴더를 이동한다. parentId 생략 시 최상위로 이동한다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = false, openWorldHint = false))
    public CallToolResult moveArtifactFolder(
            McpTransportContext context,
            @McpToolParam(description = "프로젝트 NanoID. 생성 시 소속 지정. 개별 항목은 ID로 소속을 확인", required = false)
                    String projectId,
            @McpToolParam(description = "폴더 NanoID", required = true) String folderId,
            @McpToolParam(description = "parentId", required = false) String parentId) {
        return results.call(() -> {
            folders.move(
                    results.userId(context),
                    resources.folderProject(results.userId(context), folderId, projectId),
                    folderId,
                    parentId);
            return Map.of("saved", true);
        });
    }

    @McpTool(
            name = "delete_artifact_folder",
            description = "폴더만 삭제하고 내부 문서와 하위 폴더는 상위 폴더로 이동한다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = true, openWorldHint = false))
    public CallToolResult deleteArtifactFolder(
            McpTransportContext context,
            @McpToolParam(description = "프로젝트 NanoID. 생성 시 소속 지정. 개별 항목은 ID로 소속을 확인", required = false)
                    String projectId,
            @McpToolParam(description = "폴더 NanoID", required = true) String folderId) {
        return results.call(() -> {
            folders.remove(
                    results.userId(context),
                    resources.folderProject(results.userId(context), folderId, projectId),
                    folderId);
            return Map.of("saved", true);
        });
    }
}
