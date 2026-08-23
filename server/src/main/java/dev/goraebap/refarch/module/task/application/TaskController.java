package dev.goraebap.refarch.module.task.application;

import dev.goraebap.refarch.module.task.application.TaskRequests.CreateTask;
import dev.goraebap.refarch.module.task.application.TaskViews.TaskView;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 작업 API (TK-001 · TK-002).
 *
 * <p>생성의 응답을 조회로 조립한다. 명령이 만들어낸 것(식별자)은 명령이 주고, 화면이 필요로 하는
 * 나머지는 조회가 준다 — 명령이 화면 구조를 알지 않게 하는 것이 이 배치의 목적이다.
 */
@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService tasks;

    @PostMapping
    public ResponseEntity<TaskView> add(@Valid @RequestBody CreateTask request) {
        UUID id = tasks.add(request.title());
        return ResponseEntity.created(URI.create("/api/v1/tasks/" + id)).body(tasks.detail(id));
    }

    @GetMapping
    public List<TaskView> list() {
        return tasks.list();
    }

    @GetMapping("/{taskId}")
    public TaskView detail(@PathVariable UUID taskId) {
        return tasks.detail(taskId);
    }
}
