import { createContext, useContext } from 'react';
import { type Project } from './data';
import { type Invitation, type ProjectMember } from './members';

export interface WorkspaceStore {
  readonly projects: readonly Project[];
  readonly createProject: (name: string, description: string, ownerName: string, image?: File) => string;
  readonly projectOrderByUser: Readonly<Record<string, readonly string[]>>;
  readonly moveProject: (userId: string, projectId: string, targetId: string) => void;
  readonly updateProject: (id: string, patch: Partial<Project>) => void;
  readonly deleteProject: (id: string) => void;
  readonly members: readonly ProjectMember[];
  readonly invitations: readonly Invitation[];
  readonly setMembers: React.Dispatch<React.SetStateAction<ProjectMember[]>>;
  readonly setInvitations: React.Dispatch<React.SetStateAction<Invitation[]>>;
}

export const Context = createContext<WorkspaceStore | null>(null);

export function useWorkspaceStore(): WorkspaceStore {
  const value = useContext(Context);
  if (!value) throw new Error('WorkspaceProvider 안에서만 사용합니다.');
  return value;
}
