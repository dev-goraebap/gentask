import { TasksPage } from '@/pages/tasks';
import { parseResourceScope } from '@/shared/config';
import { useSearch } from '@tanstack/react-router';
export function TasksRoute() {
  const { projectId, scope } = parseResourceScope(useSearch({ strict: false }));
  return <TasksPage key={projectId ?? scope ?? 'all'} projectId={projectId ?? null} personal={scope === 'personal'} />;
}
