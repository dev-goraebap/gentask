export interface Project {
  readonly image?: File;
  readonly description?: string;
  readonly archived?: boolean;
  readonly id: string;
  readonly name: string;
  /** 작업 항목 식별자의 접두어. 프로젝트마다 다르다. */
  readonly prefix: string;
}

export const PROJECTS: Project[] = [
  { id: 'dental', name: '치과 예약 솔루션', prefix: 'GT' },
  { id: 'stock', name: '사내 재고 관리', prefix: 'ST' },
];

export type Role = 'owner' | 'editor' | 'viewer';

export interface Member {
  readonly name: string;
  readonly role: Role;
  /** 계정 없이 초대 링크로 참여한 구성원. 완료 판정을 할 수 없다. */
  readonly isGuest?: boolean;
}

export const MEMBERS: Member[] = [
  { name: '고재범', role: 'owner' },
  { name: '윤도경', role: 'editor' },
  { name: '김세아', role: 'viewer', isGuest: true },
];
