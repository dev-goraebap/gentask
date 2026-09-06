import { removeProjectDocuments } from '@/entities/document';
import { useIssueStore } from '@/entities/issue';
import { useWorkspaceStore } from '@/entities/workspace';

export function useDeleteWorkspace() {
  const { projects, deleteProject } = useWorkspaceStore();
  const { removeProjectItems } = useIssueStore();
  return (id: string) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    removeProjectDocuments(id);
    removeProjectItems(project.prefix);
    deleteProject(id);
  };
}
