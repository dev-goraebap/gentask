package xyz.gentask.module.file.application;

import io.modelcontextprotocol.common.McpTransportContext;
import io.modelcontextprotocol.spec.McpSchema.CallToolResult;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.mcp.annotation.McpTool;
import org.springframework.ai.mcp.annotation.McpTool.McpAnnotations;
import org.springframework.ai.mcp.annotation.McpToolParam;
import org.springframework.stereotype.Component;
import xyz.gentask.shared.mcp.McpResults;

@Component
@RequiredArgsConstructor
public class FileMcpTools {
    private final McpResults results;
    private final FileService files;

    @McpTool(
            name = "prepare_file_upload",
            description =
                    "파일 업로드용 URL과 objectKey를 발급한다. URL에 지정한 Content-Type으로 파일 원문을 PUT한 다음 attach_task_file, attach_note_file 또는 set_profile_image를 호출한다. slot은 TASK_FILES, NOTE_FILES 또는 USER_PROFILE_IMAGE이다. size는 바이트 수이다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = false, openWorldHint = false))
    public CallToolResult prepareFileUpload(
            McpTransportContext context,
            @McpToolParam(description = "slot", required = true) String slot,
            @McpToolParam(description = "fileName", required = true) String fileName,
            @McpToolParam(description = "contentType", required = true) String contentType,
            @McpToolParam(description = "size", required = true) long size,
            @McpToolParam(
                            description = "이미지와 어울리는 대표색(#RRGGBB). 에이전트가 이미지를 보고 제안해도 된다. 판단할 수 없거나 이미지가 아니면 생략한다.",
                            required = false)
                    String dominantColor,
            @McpToolParam(description = "원본 이미지의 실제 너비(px). 확인할 수 없으면 생략한다.", required = false) Integer width,
            @McpToolParam(description = "원본 이미지의 실제 높이(px). 확인할 수 없으면 생략한다.", required = false) Integer height) {
        return results.call(() -> {
            var r = results.validate(new AttachmentRequests.PresignAttachment(
                    xyz.gentask.module.file.AttachmentSlot.valueOf(slot),
                    fileName,
                    contentType,
                    size,
                    dominantColor,
                    width,
                    height));
            return files.presign(
                    r.slot(),
                    results.userId(context),
                    r.fileName(),
                    r.contentType(),
                    r.size(),
                    r.dominantColor(),
                    r.width(),
                    r.height());
        });
    }
}
