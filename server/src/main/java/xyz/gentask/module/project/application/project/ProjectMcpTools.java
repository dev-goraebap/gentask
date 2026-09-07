package xyz.gentask.module.project.application.project;

import io.modelcontextprotocol.common.McpTransportContext;
import io.modelcontextprotocol.spec.McpSchema.CallToolResult;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.mcp.annotation.McpTool;
import org.springframework.ai.mcp.annotation.McpTool.McpAnnotations;
import org.springframework.stereotype.Component;
import xyz.gentask.shared.mcp.McpResults;

@Component
@RequiredArgsConstructor
public class ProjectMcpTools {
    private final ProjectService projects;
    private final McpResults results;

    @McpTool(
            name = "list_projects",
            description = "인증된 사용자가 접근할 수 있는 프로젝트와 식별자를 조회한다. 현재 접근 정책은 소유자에게만 허용한다.",
            annotations = @McpAnnotations(readOnlyHint = true, destructiveHint = false, openWorldHint = false))
    public CallToolResult listProjects(McpTransportContext context) {
        return results.call(() -> projects.list(results.userId(context)));
    }
}
