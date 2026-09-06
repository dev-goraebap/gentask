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
INITIAL_PROJECT_MEMBERS.push(...Array.from({ length: 123 }, (_, i): ProjectMember => ({
  id: `dental-sample-${i}`, projectId: 'dental',
  name: `${['김', '이', '박', '최', '정'][i % 5]}${['서윤', '도현', '하준', '지우', '수빈', '민서'][i % 6]} ${String(i + 1).padStart(3, '0')}${i % 17 === 0 ? ' 외부 협력사 서비스 운영 검토 담당자' : ''}`,
  role: i % 3 === 0 ? 'viewer' : 'editor', isGuest: i % 4 === 0,
  joinedOn: `2026-08-${String(i % 28 + 1).padStart(2, '0')}`,
})));
