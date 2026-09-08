package xyz.gentask.module.project.application.project;

import io.modelcontextprotocol.common.McpTransportContext;
import io.modelcontextprotocol.spec.McpSchema.CallToolResult;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.mcp.annotation.McpTool;
import org.springframework.ai.mcp.annotation.McpTool.McpAnnotations;
import org.springframework.ai.mcp.annotation.McpToolParam;
import org.springframework.stereotype.Component;
import xyz.gentask.shared.mcp.McpResults;

@Component
@RequiredArgsConstructor
public class ProjectMcpTools {
    private final ProjectService projects;
    private final McpResults results;

    @McpTool(
            name = "list_projects",
            description = "인증된 사용자가 접근할 수 있는 프로젝트와 식별자를 조회한다. 프로젝트 멤버 권한을 적용한다.",
            annotations = @McpAnnotations(readOnlyHint = true, destructiveHint = false, openWorldHint = false))
    public CallToolResult listProjects(McpTransportContext context) {
        return results.call(() -> projects.list(results.userId(context)));
    }

    @McpTool(
            name = "get_project",
            description = "프로젝트 상세와 자신의 역할을 조회한다.",
            annotations = @McpAnnotations(readOnlyHint = true, destructiveHint = false, openWorldHint = false))
    public CallToolResult getProject(
            McpTransportContext context, @McpToolParam(description = "프로젝트 NanoID", required = true) String projectId) {
        return results.call(() -> {
            return projects.detail(results.userId(context), projectId);
        });
    }

    @McpTool(
            name = "create_project",
            description = "프로젝트를 생성한다. key는 사용자가 정한 프로젝트 접두어이다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = false, openWorldHint = false))
    public CallToolResult createProject(
            McpTransportContext context,
            @McpToolParam(description = "name", required = true) String name,
            @McpToolParam(description = "key", required = true) String key) {
        return results.call(() -> {
            var r = results.validate(new ProjectRequests.CreateProject(name, key));
            return Map.of("id", projects.create(results.userId(context), r.name(), r.key()));
        });
    }

    @McpTool(
            name = "update_project",
            description = "프로젝트 이름과 접두어를 변경한다. 생략한 값은 유지한다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = false, openWorldHint = false))
    public CallToolResult updateProject(
            McpTransportContext context,
            @McpToolParam(description = "프로젝트 NanoID", required = true) String projectId,
            @McpToolParam(description = "name", required = false) String name,
            @McpToolParam(description = "key", required = false) String key) {
        return results.call(() -> {
            var r = results.validate(new ProjectRequests.EditProject(name, key));
            projects.edit(results.userId(context), projectId, r.name(), r.key());
            return Map.of("saved", true);
        });
    }
}
