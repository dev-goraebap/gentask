import { TasksPage } from '@/pages/tasks';
import { useSearch } from '@tanstack/react-router';

export function TaskCreateRoute() {
  const { projectId, state } = useSearch({ from: '/tasks/new' });
  return <TasksPage key={`${projectId ?? 'personal'}:${state}`} projectId={projectId ?? null} initialState={state} />;
}
