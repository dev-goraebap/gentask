import { useSession } from '@/entities/session';
import { orderedProjectIds, useWorkspaceStore } from '@/entities/workspace';
export function useProjectList() {
  const { data: me } = useSession();
  const { projects, projectOrderByUser, moveProject } = useWorkspaceStore();
  const userId = me?.id ?? '';
  const order = orderedProjectIds(projects.map(project => project.id), projectOrderByUser[userId] ?? []);
  return {
    projects: order.flatMap(id => projects.filter(project => project.id === id)),
    moveProject: (source: string, target: string) => moveProject(userId, source, target),
  };
}
