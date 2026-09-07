export interface Project {
  readonly role?: string;
  readonly image?: File;
  readonly description?: string;
  readonly archived?: boolean;
  readonly id: string;
  readonly name: string;
  /** 작업 항목 식별자의 접두어. 프로젝트마다 다르다. */
  readonly prefix: string;
}

export const PROJECTS: Project[] = [
  { id: 'gentask', name: 'Gentask', prefix: 'GT', description: '사람과 에이전트가 함께 사용하는 프로젝트 지식 공간' },
];

export type Role = 'owner' | 'editor' | 'viewer';

export interface Member {
  readonly name: string;
  readonly role: Role;
  /** 계정 없이 초대 링크로 참여한 구성원. 완료 판정을 할 수 없다. */
  readonly isGuest?: boolean;
}

export const MEMBERS: Member[] = [{ name: '고재범', role: 'owner' }];
