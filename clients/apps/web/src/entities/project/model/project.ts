import type { IconName } from '@/shared/ui/icon';

/**
 * 프로젝트.
 *
 * <p>트래커 자리의 모든 것이 이것 하나에 매인다. 계정을 만들 때 기본 프로젝트가 함께 선다(PRD 2.1).
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
 * 이어 둔 저장소.
 *
 * <p>잇는 것은 선택이다. 잇지 않아도 작업 아이템은 그대로 쓰며, 이으면 커밋 메시지가 가리킨 그것에
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
