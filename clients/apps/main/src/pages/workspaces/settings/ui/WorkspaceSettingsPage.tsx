import { useWorkspaceStore } from '@/entities/workspace';
import { EmptyState } from '@astryxdesign/core';
import { useParams } from '@tanstack/react-router';
import { SettingsForm } from './SettingsForm';


export function WorkspaceSettingsPage() {
  const { projectId } = useParams({ strict: false });
  const { projects } = useWorkspaceStore();
  const project = projects.find((p) => p.id === projectId);
  return project && project.role !== 'owner' ? <EmptyState title="프로젝트 설정은 소유자가 관리합니다" /> : project ? <SettingsForm key={project.id} project={project} /> : <EmptyState title="프로젝트를 찾을 수 없습니다" />;
}
