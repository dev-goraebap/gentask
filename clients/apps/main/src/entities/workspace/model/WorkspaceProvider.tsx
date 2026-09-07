import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RequestState } from '@/shared/ui/request-state';
import { projectsOptions } from '../api/projects';
import { Context, type WorkspaceStore } from './useWorkspaceStore';
import { moveProjectId } from '../lib/project-order';
import type { Invitation, ProjectMember } from './members';

export function WorkspaceProvider({ children }: { readonly children: ReactNode }) {
  const query = useQuery(projectsOptions());
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [projectOrderByUser, setProjectOrderByUser] = useState<Record<string, readonly string[]>>({});
  const unsupported = (): never => { throw new Error('현재 지원하지 않는 프로젝트 작업입니다.'); };
  const projects = (query.data ?? []).map(project => ({ id: project.id, name: project.name, prefix: project.key }));
  const value: WorkspaceStore = {
    projects, members, invitations, setMembers, setInvitations, projectOrderByUser,
    createProject: unsupported, updateProject: unsupported, deleteProject: unsupported,
    moveProject: (userId, projectId, targetId) => setProjectOrderByUser(previous => ({
      ...previous, [userId]: moveProjectId(projects.map(project => project.id), previous[userId] ?? [], projectId, targetId),
    })),
  };
  if (!query.data) return <RequestState error={query.error} retry={() => { void query.refetch(); }} />;
  return <Context.Provider value={value}>
    {query.isRefetchError ? <RequestState error={query.error} retry={() => { void query.refetch(); }} /> : null}
    {children}
  </Context.Provider>;
}
