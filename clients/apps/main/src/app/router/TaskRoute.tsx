import { TasksPage } from '@/pages/tasks';
import { parseResourceScope } from '@/shared/config';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';

export function TaskRoute() {
  const { taskId } = useParams({ from: '/tasks/$taskId' });
  const scope = parseResourceScope(useSearch({ strict: false }));
  const navigate = useNavigate();
  return <TasksPage key={taskId} taskId={taskId} onBack={() => { void navigate({ to: '/tasks', search: scope }); }} />;
}
