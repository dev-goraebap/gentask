package xyz.gentask.module.artifact.application.artifact;

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
public class ArtifactMcpTools {
    private final ArtifactService artifacts;
    private final McpResults results;

    @McpTool(
            name = "list_artifacts",
            description = "프로젝트의 아티팩트 제목, 폴더 식별자와 수정 시각을 조회한다. 본문은 get_artifact로 조회한다.",
            annotations = @McpAnnotations(readOnlyHint = true, destructiveHint = false, openWorldHint = false))
    public CallToolResult listArtifacts(
            McpTransportContext context,
            @McpToolParam(description = "프로젝트의 공개 식별자", required = true) String projectId) {
        return results.call(() -> artifacts.list(results.userId(context), projectId));
    }

    @McpTool(
            name = "get_artifact",
            description = "아티팩트의 마크다운 원문, 제목, 현재 개정 번호를 조회한다.",
            annotations = @McpAnnotations(readOnlyHint = true, destructiveHint = false, openWorldHint = false))
    public CallToolResult getArtifact(
            McpTransportContext context,
            @McpToolParam(description = "프로젝트의 공개 식별자", required = true) String projectId,
            @McpToolParam(description = "아티팩트 UUID", required = true) String artifactId) {
        return results.call(() -> artifacts.detail(results.userId(context), projectId, artifactId));
    }

    @McpTool(
            name = "create_artifact",
            description = "마크다운 아티팩트를 생성하고 식별자를 반환한다. folderId를 생략하면 최상위에 생성한다. 첫 개정이 함께 기록된다.",
            annotations = @McpAnnotations(destructiveHint = false, openWorldHint = false))
    public CallToolResult createArtifact(
            McpTransportContext context,
            @McpToolParam(description = "프로젝트의 공개 식별자", required = true) String projectId,
            @McpToolParam(description = "제목", required = true) String title,
            @McpToolParam(description = "마크다운 원문", required = true) String body,
            @McpToolParam(description = "대상 폴더 UUID", required = false) String folderId) {
        return results.call(() -> {
            var request = results.validate(new ArtifactRequests.CreateArtifact(title, body, folderId));
            return Map.of(
                    "id",
                    artifacts.add(
                            results.userId(context), projectId, request.title(), request.body(), request.folderId()));
        });
    }

    @McpTool(
            name = "update_artifact",
            description = "제목과 마크다운 본문 전체를 교체하고 개정을 기록한다. 수정 전 get_artifact로 최신 본문을 확인한다. 현재 동시 편집 충돌 검사는 제공하지 않는다.",
            annotations = @McpAnnotations(destructiveHint = true, openWorldHint = false))
    public CallToolResult updateArtifact(
            McpTransportContext context,
            @McpToolParam(description = "프로젝트의 공개 식별자", required = true) String projectId,
            @McpToolParam(description = "아티팩트 UUID", required = true) String artifactId,
            @McpToolParam(description = "새 제목", required = true) String title,
            @McpToolParam(description = "새 마크다운 본문 전체", required = true) String body,
            @McpToolParam(description = "개정 사유", required = false) String comment) {
        return results.call(() -> {
            var request = results.validate(new ArtifactRequests.EditArtifact(title, body, comment));
            artifacts.edit(
                    results.userId(context), projectId, artifactId, request.title(), request.body(), request.comment());
            return Map.of("id", artifactId, "saved", true);
        });
    }

    @McpTool(
            name = "list_artifact_revisions",
            description = "아티팩트 개정 이력을 최신순으로 조회한다. page는 0부터, size는 최대 100이다.",
            annotations = @McpAnnotations(readOnlyHint = true, destructiveHint = false, openWorldHint = false))
    public CallToolResult listRevisions(
            McpTransportContext context,
            @McpToolParam(description = "프로젝트의 공개 식별자", required = true) String projectId,
            @McpToolParam(description = "아티팩트 UUID", required = true) String artifactId,
            @McpToolParam(description = "0부터 시작하는 페이지", required = false) Integer page,
            @McpToolParam(description = "페이지 크기. 기본 25, 최대 100", required = false) Integer size) {
        return results.call(() -> artifacts.revisions(
                results.userId(context), projectId, artifactId, page == null ? 0 : page, size == null ? 25 : size));
    }

    @McpTool(
            name = "get_artifact_revision",
            description = "지정한 개정의 제목과 마크다운 본문을 조회한다.",
            annotations = @McpAnnotations(readOnlyHint = true, destructiveHint = false, openWorldHint = false))
    public CallToolResult getRevision(
            McpTransportContext context,
            @McpToolParam(description = "프로젝트의 공개 식별자", required = true) String projectId,
            @McpToolParam(description = "아티팩트 UUID", required = true) String artifactId,
            @McpToolParam(description = "1부터 시작하는 개정 번호", required = true) String revisionNo) {
        return results.call(() -> artifacts.revision(results.userId(context), projectId, artifactId, revisionNo));
    }
}
