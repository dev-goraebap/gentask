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
            description = "projectId를 생략하면 개인 작업과 자신에게 할당된 프로젝트 작업을 조회한다.",
            annotations = @McpAnnotations(readOnlyHint = true, destructiveHint = false, openWorldHint = false))
    public CallToolResult listTasks(
            McpTransportContext context,
            @McpToolParam(description = "프로젝트 NanoID. 생략하면 개인 영역", required = false) String projectId) {
        return results.call(() -> {
            return projectId == null
                    ? tasks.list(results.userId(context))
                    : tasks.listProject(results.userId(context), projectId);
        });
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
            @McpToolParam(description = "dueDate", required = false) String dueDate) {
        return results.call(() -> {
            var r = results.validate(
                    new TaskRequests.CreateTask(title, dueDate == null ? null : LocalDate.parse(dueDate)));
            return Map.of(
                    "id",
                    projectId == null
                            ? tasks.add(results.userId(context), r.title(), r.dueDate())
                            : tasks.addProject(results.userId(context), projectId, r.title(), r.dueDate()));
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
            description = "작업 상태를 TODO, IN_PROGRESS, DONE 중 하나로 바꾼다.",
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
}
