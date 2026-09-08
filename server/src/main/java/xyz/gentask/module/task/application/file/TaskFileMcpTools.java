package xyz.gentask.module.task.application.file;

import io.modelcontextprotocol.common.McpTransportContext;
import io.modelcontextprotocol.spec.McpSchema.CallToolResult;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.mcp.annotation.McpTool;
import org.springframework.ai.mcp.annotation.McpTool.McpAnnotations;
import org.springframework.ai.mcp.annotation.McpToolParam;
import org.springframework.stereotype.Component;
import xyz.gentask.shared.mcp.McpResults;

@Component
@RequiredArgsConstructor
public class TaskFileMcpTools {
    private final McpResults results;
    private final TaskFileService files;

    @McpTool(
            name = "list_task_files",
            description = "작업 첨부파일과 다운로드 URL을 조회한다.",
            annotations = @McpAnnotations(readOnlyHint = true, destructiveHint = false, openWorldHint = false))
    public CallToolResult listTaskFiles(
            McpTransportContext context, @McpToolParam(description = "작업 UUID", required = true) String taskId) {
        return results.call(() -> {
            return files.list(results.userId(context), UUID.fromString(taskId));
        });
    }

    @McpTool(
            name = "attach_task_file",
            description = "업로드를 마친 objectKey를 작업에 연결한다. 먼저 prepare_file_upload의 URL에 파일을 PUT한다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = false, openWorldHint = false))
    public CallToolResult attachTaskFile(
            McpTransportContext context,
            @McpToolParam(description = "작업 UUID", required = true) String taskId,
            @McpToolParam(description = "objectKey", required = true) String objectKey,
            @McpToolParam(description = "fileName", required = true) String fileName,
            @McpToolParam(description = "contentType", required = true) String contentType) {
        return results.call(() -> {
            var r = results.validate(new TaskFileRequests.AttachTaskFile(objectKey, fileName, contentType));
            return files.attach(
                    results.userId(context), UUID.fromString(taskId), r.objectKey(), r.fileName(), r.contentType());
        });
    }

    @McpTool(
            name = "delete_task_file",
            description = "작업 첨부파일을 삭제한다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = true, openWorldHint = false))
    public CallToolResult deleteTaskFile(
            McpTransportContext context,
            @McpToolParam(description = "작업 UUID", required = true) String taskId,
            @McpToolParam(description = "taskFileId", required = true) String taskFileId) {
        return results.call(() -> {
            files.detach(results.userId(context), UUID.fromString(taskId), UUID.fromString(taskFileId));
            return Map.of("saved", true);
        });
    }
}
