import { TasksPage } from '@/pages/tasks';
import { parseResourceScope } from '@/shared/config';
import { useSearch } from '@tanstack/react-router';
export function TasksRoute() {
  const { projectId, scope } = parseResourceScope(useSearch({ strict: false }));
  return <TasksPage key={projectId ?? scope ?? 'personal'} projectId={projectId ?? null} personal={scope === 'personal'} />;
}
