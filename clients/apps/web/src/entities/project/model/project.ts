import type { IconName } from '@/shared/ui/icon';

/**
 * 프로젝트.
 *
 * 트래커의 모든 리소스는 프로젝트 애그리거트에 종속된다(PRD 2.1).
 */
export interface Project {
  readonly id: string;
  readonly name: string;
  /** 작업 아이템 번호 앞에 붙는다. 번호가 매겨진 뒤에는 바꾸지 않는다. */
  readonly key: string;
  readonly issueCount: number;
  readonly docCount: number;
}

export const REPOSITORY_HOSTS = {
  github: 'GITHUB',
  gitlab: 'GITLAB',
} as const;

export type RepositoryHost = (typeof REPOSITORY_HOSTS)[keyof typeof REPOSITORY_HOSTS];

export const REPOSITORY_STATES = {
  linked: 'LINKED',
  pending: 'PENDING',
} as const;

export type RepositoryState = (typeof REPOSITORY_STATES)[keyof typeof REPOSITORY_STATES];

/**
 * 연계 저장소 정보 모델이다.
 *
 * 저장소 연계는 선택 사항이며 미연동 상태에서도 모든 기능을 동일하게 사용한다.
 * 커밋이 붙는다.
 */
export interface RepositoryLink {
  readonly id: string;
  readonly host: RepositoryHost;
  readonly fullName: string;
  readonly state: RepositoryState;
  readonly linkedCommitCount: number;
  readonly lastLinkedOn: string | null;
}

export function repositoryIcon(host: RepositoryHost): IconName {
  return host === REPOSITORY_HOSTS.github ? 'hgiGithub' : 'hgiGitBranch';
}

export function repositoryHostLabel(host: RepositoryHost): string {
  return host === REPOSITORY_HOSTS.github ? 'GitHub' : 'GitLab';
}

export function isPending(link: RepositoryLink): boolean {
  return link.state === REPOSITORY_STATES.pending;
}
