package dev.goraebap.refarch.module.task.application;

import dev.goraebap.refarch.module.task.application.TaskViews.TaskView;
import dev.goraebap.refarch.module.task.domain.Task;
import dev.goraebap.refarch.module.task.domain.TaskRepository;
import dev.goraebap.refarch.module.task.domain.TaskTitle;
import java.time.Clock;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 작업 유스케이스 (TK-001 · TK-002).
 *
 * <p>명령과 조회를 한 클래스가 갖되 <b>경로는 나눈다.</b> 명령은 저장소로 애그리거트를 통과하고
 * 조회는 포트가 화면 구조를 만든다. 조회에만 쓰이는 의존이 둘 이상 생기면 그때 클래스를 나눈다.
 *
 * <p>트랜잭션을 메서드마다 선언한다. 클래스 레벨로 두면 조회 메서드에도 쓰기 트랜잭션이 걸린다.
 */
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository tasks;
    private final TaskQueries queries;
    private final Clock clock;

    /**
     * 제목만으로 작업을 만든다. TK-001 기본 흐름.
     *
     * <p>식별자만 돌려준다. 화면이 필요로 하는 나머지는 조회가 주며, 그래야 명령이 화면 구조를
     * 알지 않아도 된다.
     */
    @Transactional
    public UUID add(String title) {
        Task task = Task.create(UUID.randomUUID(), new TaskTitle(title), clock.instant());
        tasks.save(task);
        return task.id();
    }

    @Transactional(readOnly = true)
    public List<TaskView> list() {
        return queries.findAll();
    }

    @Transactional(readOnly = true)
    public TaskView detail(UUID taskId) {
        return queries.findOne(taskId).orElseThrow(TaskErrorCode.TASK_NOT_FOUND::raise);
    }
}
