package xyz.gentask.module.task.application.task;

import io.modelcontextprotocol.common.McpTransportContext;
import io.modelcontextprotocol.spec.McpSchema.CallToolResult;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
public class TaskMcpTools {
    private final McpResults results;
    private final TaskService tasks;

    @McpTool(
            name = "list_tasks",
            description = "접근 가능한 작업을 조회한다. projectId로 프로젝트를, scope=personal로 개인 작업만 선택한다.",
            annotations = @McpAnnotations(readOnlyHint = true, destructiveHint = false, openWorldHint = false))
    public CallToolResult listTasks(
            McpTransportContext context,
            @McpToolParam(description = "프로젝트 NanoID. 생략하면 개인 영역", required = false) String projectId,
            @McpToolParam(description = "personal: 개인만. 생략: 전체. projectId와 함께 사용할 수 없음", required = false) String scope,
            @McpToolParam(description = "작업 기간에 포함되는 날짜 YYYY-MM-DD. 생략하면 전체 기간", required = false) String date,
            @McpToolParam(description = "날짜가 모두 없는 작업만 조회. date와 함께 사용 불가", required = false) Boolean undated,
            @McpToolParam(description = "기준 날짜 이전 마감인 미완료 작업도 포함", required = false) Boolean includeOverdue) {
        return results.call(() -> tasks.list(
                results.userId(context),
                projectId,
                scope,
                new TaskDateFilter(
                        date == null ? null : LocalDate.parse(date),
                        Boolean.TRUE.equals(undated),
                        Boolean.TRUE.equals(includeOverdue))));
    }

    @McpTool(
            name = "get_task",
            description = "작업 상세를 조회한다.",
            annotations = @McpAnnotations(readOnlyHint = true, destructiveHint = false, openWorldHint = false))
    public CallToolResult getTask(
            McpTransportContext context, @McpToolParam(description = "작업 UUID", required = true) String taskId) {
        return results.call(() -> {
            return tasks.detail(results.userId(context), UUID.fromString(taskId));
        });
    }

    @McpTool(
            name = "create_task",
            description = "개인 또는 프로젝트 작업을 생성한다. 마감일은 YYYY-MM-DD이다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = false, openWorldHint = false))
    public CallToolResult createTask(
            McpTransportContext context,
            @McpToolParam(description = "프로젝트 NanoID. 생략하면 개인 영역", required = false) String projectId,
            @McpToolParam(description = "title", required = true) String title,
            @McpToolParam(description = "마감일 YYYY-MM-DD", required = false) String dueDate,
            @McpToolParam(description = "예정일 YYYY-MM-DD", required = false) String scheduledDate,
            @McpToolParam(description = "마크다운 설명", required = false) String note,
            @McpToolParam(description = "TODO, PLANNED, IN_PROGRESS, DONE. 기본 TODO", required = false) String state,
            @McpToolParam(description = "프로젝트 담당자 UUID", required = false) String assigneeId) {
        return results.call(() -> {
            var input = results.validate(new TaskRequests.CreateScopedTask(
                    title,
                    note,
                    projectId,
                    assigneeId == null ? null : UUID.fromString(assigneeId),
                    state == null ? null : xyz.gentask.module.task.domain.task.TaskState.valueOf(state),
                    scheduledDate == null ? null : LocalDate.parse(scheduledDate),
                    dueDate == null ? null : LocalDate.parse(dueDate)));
            return Map.of("id", tasks.create(results.userId(context), input));
        });
    }

    @McpTool(
            name = "set_task_schedule",
            description = "작업 예정일과 마감일을 함께 교체한다. 생략한 날짜는 비운다. 예정일은 마감일 이하여야 한다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = true, openWorldHint = false))
    public CallToolResult schedule(
            McpTransportContext context,
            @McpToolParam(description = "작업 UUID", required = true) String taskId,
            @McpToolParam(description = "예정일 YYYY-MM-DD", required = false) String scheduledDate,
            @McpToolParam(description = "마감일 YYYY-MM-DD", required = false) String dueDate) {
        return results.call(() -> {
            tasks.schedule(
                    results.userId(context),
                    UUID.fromString(taskId),
                    scheduledDate == null ? null : LocalDate.parse(scheduledDate),
                    dueDate == null ? null : LocalDate.parse(dueDate));
            return Map.of("saved", true);
        });
    }

    @McpTool(
            name = "update_task",
            description =
                    "제목·설명·마감일·알림 시각을 전체 교체한다. 먼저 get_task로 현재 값을 확인한다. 날짜를 생략하면 비운다. remindAt은 YYYY-MM-DDTHH:mm이다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = true, openWorldHint = false))
    public CallToolResult updateTask(
            McpTransportContext context,
            @McpToolParam(description = "작업 UUID", required = true) String taskId,
            @McpToolParam(description = "title", required = true) String title,
            @McpToolParam(description = "note", required = true) String note,
            @McpToolParam(description = "dueDate", required = false) String dueDate,
            @McpToolParam(description = "remindAt", required = false) String remindAt) {
        return results.call(() -> {
            var r = results.validate(new TaskRequests.EditTask(
                    title,
                    note,
                    dueDate == null ? null : LocalDate.parse(dueDate),
                    remindAt == null ? null : LocalDateTime.parse(remindAt)));
            tasks.edit(
                    results.userId(context), UUID.fromString(taskId), r.title(), r.note(), r.dueDate(), r.remindAt());
            return Map.of("saved", true);
        });
    }

    @McpTool(
            name = "change_task_state",
            description = "작업 상태를 TODO, PLANNED, IN_PROGRESS, DONE 중 하나로 바꾼다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = false, openWorldHint = false))
    public CallToolResult changeTaskState(
            McpTransportContext context,
            @McpToolParam(description = "작업 UUID", required = true) String taskId,
            @McpToolParam(description = "state", required = true) String state) {
        return results.call(() -> {
            tasks.changeState(
                    results.userId(context),
                    UUID.fromString(taskId),
                    results.validate(new TaskController.ChangeTaskState(state)).state());
            return Map.of("saved", true);
        });
    }

    @McpTool(
            name = "assign_task",
            description = "프로젝트 작업 담당자를 지정한다. assigneeId 생략 시 해제한다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = false, openWorldHint = false))
    public CallToolResult assignTask(
            McpTransportContext context,
            @McpToolParam(description = "작업 UUID", required = true) String taskId,
            @McpToolParam(description = "assigneeId", required = false) String assigneeId) {
        return results.call(() -> {
            tasks.assign(
                    results.userId(context),
                    UUID.fromString(taskId),
                    assigneeId == null ? null : UUID.fromString(assigneeId));
            return Map.of("saved", true);
        });
    }

    @McpTool(
            name = "set_task_importance",
            description = "개인 작업의 중요 표시를 변경한다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = false, openWorldHint = false))
    public CallToolResult setTaskImportance(
            McpTransportContext context,
            @McpToolParam(description = "작업 UUID", required = true) String taskId,
            @McpToolParam(description = "important", required = true) boolean important) {
        return results.call(() -> {
            tasks.changeImportance(results.userId(context), UUID.fromString(taskId), important);
            return Map.of("saved", true);
        });
    }

    @McpTool(
            name = "set_task_my_day",
            description = "내 하루에 개인 작업을 추가하거나 제외한다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = false, openWorldHint = false))
    public CallToolResult setTaskMyDay(
            McpTransportContext context,
            @McpToolParam(description = "작업 UUID", required = true) String taskId,
            @McpToolParam(description = "inMyDay", required = true) boolean inMyDay) {
        return results.call(() -> {
            tasks.changeMyDay(results.userId(context), UUID.fromString(taskId), inMyDay);
            return Map.of("saved", true);
        });
    }

    @McpTool(
            name = "delete_task",
            description = "작업과 연결된 첨부파일을 삭제한다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = true, openWorldHint = false))
    public CallToolResult deleteTask(
            McpTransportContext context, @McpToolParam(description = "작업 UUID", required = true) String taskId) {
        return results.call(() -> {
            tasks.remove(results.userId(context), UUID.fromString(taskId));
            return Map.of("saved", true);
        });
    }

    @McpTool(
            name = "link_task_artifact",
            description = "작업에 같은 영역의 아티팩트를 연결한다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = false, openWorldHint = false))
    public CallToolResult linkTaskArtifact(
            McpTransportContext context,
            @McpToolParam(description = "작업 UUID", required = true) String taskId,
            @McpToolParam(description = "아티팩트 NanoID", required = true) String artifactId) {
        return results.call(() -> {
            tasks.linkArtifact(results.userId(context), UUID.fromString(taskId), artifactId);
            return Map.of("saved", true);
        });
    }

    @McpTool(
            name = "unlink_task_artifact",
            description = "작업의 아티팩트 연결만 해제한다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = false, openWorldHint = false))
    public CallToolResult unlinkTaskArtifact(
            McpTransportContext context,
            @McpToolParam(description = "작업 UUID", required = true) String taskId,
            @McpToolParam(description = "아티팩트 NanoID", required = true) String artifactId) {
        return results.call(() -> {
            tasks.unlinkArtifact(results.userId(context), UUID.fromString(taskId), artifactId);
            return Map.of("saved", true);
        });
    }

    @McpTool(
            name = "list_task_artifacts",
            description = "작업에 연결된 아티팩트를 조회한다.",
            annotations = @McpAnnotations(readOnlyHint = true, destructiveHint = false, openWorldHint = false))
    public CallToolResult listTaskArtifacts(
            McpTransportContext context, @McpToolParam(description = "작업 UUID", required = true) String taskId) {
        return results.call(() -> {
            return tasks.linkedArtifacts(results.userId(context), UUID.fromString(taskId));
        });
    }

    @McpTool(
            name = "list_task_notes",
            description = "작업에 연결된 접근 가능한 메모를 조회한다. 공유 해제되거나 다른 영역으로 이동한 메모는 제외한다.",
            annotations = @McpAnnotations(readOnlyHint = true, destructiveHint = false, openWorldHint = false))
    public CallToolResult linkedNotes(
            McpTransportContext context, @McpToolParam(description = "작업 UUID", required = true) String taskId) {
        return results.call(() -> {
            return tasks.linkedNotes(results.userId(context), UUID.fromString(taskId));
        });
    }

    @McpTool(
            name = "link_task_note",
            description = "같은 영역의 메모를 작업에 연결한다. 프로젝트 작업에는 공유된 메모만 연결하며 공개 범위를 바꾸지 않는다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = false, openWorldHint = false))
    public CallToolResult linkNote(
            McpTransportContext context,
            @McpToolParam(description = "작업 UUID", required = true) String taskId,
            @McpToolParam(description = "메모 NanoID", required = true) String noteId) {
        return results.call(() -> {
            tasks.linkNote(results.userId(context), UUID.fromString(taskId), noteId);
            return Map.of("saved", true);
        });
    }

    @McpTool(
            name = "unlink_task_note",
            description = "작업과 메모의 연결만 해제한다. 원본 메모는 유지한다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = false, openWorldHint = false))
    public CallToolResult unlinkNote(
            McpTransportContext context,
            @McpToolParam(description = "작업 UUID", required = true) String taskId,
            @McpToolParam(description = "메모 NanoID", required = true) String noteId) {
        return results.call(() -> {
            tasks.unlinkNote(results.userId(context), UUID.fromString(taskId), noteId);
            return Map.of("saved", true);
        });
    }
}
