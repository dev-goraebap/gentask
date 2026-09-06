import { ME, CURRENT_USER_ID } from '@/entities/session';
import { orderedProjectIds, useWorkspaceStore } from '@/entities/workspace';

export function useProjectList() {
  const { projects, members, projectOrderByUser, moveProject } = useWorkspaceStore();
  const participating = projects.filter(project => members.some(member => member.projectId === project.id && member.name === ME));
  const order = orderedProjectIds(participating.map(project => project.id), projectOrderByUser[CURRENT_USER_ID] ?? []);
  return {
    projects: order.flatMap(id => participating.filter(project => project.id === id)),
    moveProject: (source: string, target: string) => {
      if (participating.some(project => project.id === source) && participating.some(project => project.id === target)) moveProject(CURRENT_USER_ID, source, target);
    },
  };
}
