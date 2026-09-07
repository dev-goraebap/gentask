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

    @McpTool(
            name = "list_artifact_folders",
            description = "프로젝트의 폴더 목록과 parentId를 조회한다. parentId가 null이면 최상위 폴더다.",
            annotations = @McpAnnotations(readOnlyHint = true, destructiveHint = false, openWorldHint = false))
    public CallToolResult listFolders(
            McpTransportContext context,
            @McpToolParam(description = "프로젝트의 공개 식별자", required = true) String projectId) {
        return results.call(() -> folders.list(results.userId(context), projectId));
    }

    @McpTool(
            name = "create_artifact_folder",
            description = "아티팩트 폴더를 생성한다. parentId를 생략하면 최상위에 생성한다. 같은 이름도 허용되므로 먼저 목록을 확인한다.",
            annotations = @McpAnnotations(destructiveHint = false, openWorldHint = false))
    public CallToolResult createFolder(
            McpTransportContext context,
            @McpToolParam(description = "프로젝트의 공개 식별자", required = true) String projectId,
            @McpToolParam(description = "폴더 이름", required = true) String name,
            @McpToolParam(description = "상위 폴더 NanoID", required = false) String parentId) {
        return results.call(() -> {
            var request = results.validate(new ArtifactRequests.CreateFolder(name, parentId));
            return Map.of("id", folders.add(results.userId(context), projectId, request.name(), request.parentId()));
        });
    }
}
