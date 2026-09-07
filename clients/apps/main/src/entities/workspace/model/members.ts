import { TODAY } from '@/shared/config';
import { MEMBERS, PROJECTS, type Member, type Role } from './data';

export interface ProjectMember extends Member {
  readonly id: string;
  readonly projectId: string;
  readonly joinedOn: string;
}

export interface Invitation {
  readonly id: string;
  readonly projectId: string;
  readonly label: string;
  readonly role: Exclude<Role, 'owner'>;
  readonly expiresAt: number;
  readonly revoked: boolean;
  readonly uses: number;
}

export const ROLE_LABEL: Record<Role, string> = {
  owner: '소유자', editor: '편집자', viewer: '열람자',
};

export const INITIAL_PROJECT_MEMBERS: ProjectMember[] = PROJECTS.flatMap((project, index) =>
  (index === 0 ? MEMBERS : MEMBERS.filter((member) => member.name === '고재범')).map((member, i) => ({
    ...member, id: `${project.id}-${i}`, projectId: project.id, joinedOn: TODAY,
  })),
);
