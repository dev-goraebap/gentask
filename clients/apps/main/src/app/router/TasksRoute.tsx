import { toTaskView, type TaskViewKey } from '@/entities/task';
import { TasksPage } from '@/pages/tasks';
import {
    useNavigate,
    useParams,
    useSearch
} from '@tanstack/react-router';

export function TasksRoute() {
  const { view } = useParams({ from: '/tasks/$view' });
  const { task } = useSearch({ from: '/tasks/$view' });
  const navigate = useNavigate();

  return (
    <TasksPage
      view={toTaskView(view)}
      taskId={task ?? null}
      onViewChange={(next: TaskViewKey) =>
        navigate({ to: '/tasks/$view', params: { view: next }, search: {} })
      }
      onSelect={(id) =>
        navigate({
          to: '/tasks/$view',
          params: { view },
          search: id ? { task: id } : {},
        })
      }
    />
  );
}
