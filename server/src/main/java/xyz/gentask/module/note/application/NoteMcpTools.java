package xyz.gentask.module.note.application;

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
public class NoteMcpTools {
    private final McpResults results;
    private final NoteService notes;

    @McpTool(
            name = "list_notes",
            description =
                    "자신의 메모와 접근 가능한 프로젝트 공유 메모를 최신순으로 조회한다. 프로젝트 연결만 된 비공개 메모는 작성자에게만 보인다. nextOffset이 있으면 다음 목록을 조회한다.",
            annotations = @McpAnnotations(readOnlyHint = true, destructiveHint = false, openWorldHint = false))
    public CallToolResult listNotes(
            McpTransportContext context,
            @McpToolParam(description = "프로젝트 NanoID", required = false) String projectId,
            @McpToolParam(description = "본문 검색어", required = false) String query,
            @McpToolParam(description = "다음 페이지 위치", required = false) Integer offset) {
        return results.call(() -> {
            return notes.list(
                    results.userId(context),
                    projectId,
                    query == null ? "" : query,
                    offset == null ? 0 : Math.max(0, Math.min(offset, 100000)));
        });
    }

    @McpTool(
            name = "get_note",
            description = "메모 본문과 첨부파일 다운로드 URL을 조회한다. 비공개는 작성자만, 공유 메모는 현재 프로젝트 멤버가 읽을 수 있다.",
            annotations = @McpAnnotations(readOnlyHint = true, destructiveHint = false, openWorldHint = false))
    public CallToolResult getNote(
            McpTransportContext context, @McpToolParam(description = "메모 NanoID", required = true) String noteId) {
        return results.call(() -> {
            return notes.detail(results.userId(context), noteId);
        });
    }

    @McpTool(
            name = "create_note",
            description =
                    "제목 없이 마크다운 메모를 생성한다. 프로젝트 연결 여부와 무관하게 나만 보기로 생성한다. NOTE_FILES로 업로드한 objectKeys를 함께 전달하면 본문 없이 파일만 등록할 수도 있다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = false, openWorldHint = false))
    public CallToolResult createNote(
            McpTransportContext context,
            @McpToolParam(description = "마크다운 본문", required = true) String body,
            @McpToolParam(description = "프로젝트 NanoID", required = false) String projectId,
            @McpToolParam(description = "업로드한 파일 키 목록", required = false) java.util.List<String> objectKeys) {
        return results.call(() -> {
            var request = results.validate(new NoteRequests.CreateNote(body, projectId, objectKeys));
            return Map.of("id", notes.create(results.userId(context), request));
        });
    }

    @McpTool(
            name = "update_note",
            description = "작성한 메모 본문 전체를 교체한다. 먼저 get_note로 최신 본문을 확인한다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = true, openWorldHint = false))
    public CallToolResult updateNote(
            McpTransportContext context,
            @McpToolParam(description = "메모 NanoID", required = true) String noteId,
            @McpToolParam(description = "마크다운 본문", required = true) String body) {
        return results.call(() -> {
            var request = results.validate(new NoteRequests.EditNote(body));
            notes.edit(results.userId(context), noteId, request.body());
            return Map.of("saved", true);
        });
    }

    @McpTool(
            name = "connect_note_project",
            description = "작성한 메모의 프로젝트를 연결하거나 해제한다. 다른 프로젝트로 변경하면 나만 보기로 전환한다. 공유는 별도 share_note로 명시한다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = true, openWorldHint = false))
    public CallToolResult connectNoteProject(
            McpTransportContext context,
            @McpToolParam(description = "메모 NanoID", required = true) String noteId,
            @McpToolParam(description = "프로젝트 NanoID. 생략하면 연결 해제", required = false) String projectId) {
        return results.call(() -> {
            var request = results.validate(new NoteRequests.ConnectNote(projectId));
            notes.connect(results.userId(context), noteId, request.projectId());
            return Map.of("saved", true);
        });
    }

    @McpTool(
            name = "share_note",
            description = "작성자가 명시적으로 요청했을 때 프로젝트 공유 여부를 변경한다. 프로젝트를 연결한 editor/owner만 공유할 수 있다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = true, openWorldHint = false))
    public CallToolResult shareNote(
            McpTransportContext context,
            @McpToolParam(description = "메모 NanoID", required = true) String noteId,
            @McpToolParam(description = "true는 프로젝트 공유, false는 나만 보기", required = true) boolean shared) {
        return results.call(() -> {
            notes.share(results.userId(context), noteId, shared);
            return Map.of("saved", true);
        });
    }

    @McpTool(
            name = "delete_note",
            description = "자신이 작성한 메모와 첨부 연결을 삭제한다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = true, openWorldHint = false))
    public CallToolResult deleteNote(
            McpTransportContext context, @McpToolParam(description = "메모 NanoID", required = true) String noteId) {
        return results.call(() -> {
            notes.delete(results.userId(context), noteId);
            return Map.of("deleted", true);
        });
    }

    @McpTool(
            name = "attach_note_file",
            description = "NOTE_FILES로 업로드한 파일을 자신의 메모에 첨부한다. 최대 5개, 파일당 10 MB이다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = true, openWorldHint = false))
    public CallToolResult attachNoteFile(
            McpTransportContext context,
            @McpToolParam(description = "메모 NanoID", required = true) String noteId,
            @McpToolParam(description = "업로드한 파일 키", required = true) String objectKey) {
        return results.call(() -> {
            var request = results.validate(new NoteRequests.AttachNoteFile(objectKey));
            return notes.attach(results.userId(context), noteId, request.objectKey());
        });
    }

    @McpTool(
            name = "detach_note_file",
            description = "자신의 메모에서 첨부를 삭제한다. 본문 없는 메모의 마지막 첨부는 삭제할 수 없다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = true, openWorldHint = false))
    public CallToolResult detachNoteFile(
            McpTransportContext context,
            @McpToolParam(description = "메모 NanoID", required = true) String noteId,
            @McpToolParam(description = "첨부 UUID", required = true) String fileId) {
        return results.call(() -> {
            notes.detach(results.userId(context), noteId, java.util.UUID.fromString(fileId));
            return Map.of("deleted", true);
        });
    }
}
