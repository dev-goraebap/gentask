import { useMemo, useState, type ReactNode } from 'react';
import { PROJECTS, type Project } from './data';
import { INITIAL_PROJECT_MEMBERS, type Invitation } from './members';

import { Context, type WorkspaceStore } from './useWorkspaceStore';
import { moveProjectId } from '../lib/project-order';

export function WorkspaceProvider({ children }: { readonly children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [members, setMembers] = useState(INITIAL_PROJECT_MEMBERS);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  // API 연동 시 로그인 사용자별 프로젝트 ID 순서로 저장한다.
  const [projectOrderByUser, setProjectOrderByUser] = useState<Record<string, readonly string[]>>({});
  const value = useMemo<WorkspaceStore>(() => ({
    projects,
    projectOrderByUser,
    moveProject: (userId, projectId, targetId) => setProjectOrderByUser(prev => ({
      ...prev, [userId]: moveProjectId(projects.map(project => project.id), prev[userId] ?? [], projectId, targetId),
    })),
    createProject: (name, description, ownerName, image) => {
      const id = crypto.randomUUID();
      setProjects((prev) => [...prev, { id, name, description, image, prefix: `P${id.slice(0, 8).toUpperCase()}` }]);
      setMembers((prev) => [...prev, { id: crypto.randomUUID(), projectId: id, name: ownerName, role: 'owner', isGuest: false, joinedOn: new Date().toISOString().slice(0, 10) }]);
      return id;
    },
    updateProject: (id, patch) => setProjects((prev) => prev.map((p) => p.id === id ? { ...p, ...patch, id: p.id, prefix: p.prefix } : p)),
    deleteProject: (id) => {
      setProjects(prev => prev.filter(p => p.id !== id));
      setMembers(prev => prev.filter(m => m.projectId !== id));
      setInvitations(prev => prev.filter(i => i.projectId !== id));
      setProjectOrderByUser(prev => Object.fromEntries(Object.entries(prev).map(([userId, ids]) => [userId, ids.filter(value => value !== id)])));
    },
    members,
    invitations,
    setMembers,
    setInvitations
  }), [projects, members, invitations, projectOrderByUser]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
