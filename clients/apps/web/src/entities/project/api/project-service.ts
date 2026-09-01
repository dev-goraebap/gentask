import { computed, Injectable, signal } from '@angular/core';
import {
  REPOSITORY_HOSTS,
  REPOSITORY_STATES,
  type Project,
  type RepositoryLink,
} from '../model/project';

/** 목이다. 근거는 [IssueService] 와 같다. */
const PROJECTS: readonly Project[] = [
  { id: 'gentask', name: 'gentask', key: 'TG', issueCount: 37, docCount: 24 },
  { id: 'sandbox', name: '연습장', key: 'SB', issueCount: 4, docCount: 1 },
];

const LINKS: readonly RepositoryLink[] = [
  {
    id: 'gh-gentask',
    host: REPOSITORY_HOSTS.github,
    fullName: 'dev-goraebap/gentask',
    state: REPOSITORY_STATES.linked,
    linkedCommitCount: 41,
    lastLinkedOn: '2026-08-31',
  },
  {
    id: 'gl-infra',
    host: REPOSITORY_HOSTS.gitlab,
    fullName: 'gitlab.com/goraebap/infra',
    state: REPOSITORY_STATES.pending,
    linkedCommitCount: 0,
    lastLinkedOn: null,
  },
];

@Injectable()
export class ProjectService {
  // --- 상태 --------------------------------------------------------------------------------------
  private readonly projects = signal<readonly Project[]>(PROJECTS);
  private readonly currentId = signal('gentask');
  private readonly links = signal<readonly RepositoryLink[]>(LINKS);
  private sequence = 0;

  // --- 파생 --------------------------------------------------------------------------------------
  readonly list = this.projects.asReadonly();
  readonly repositories = this.links.asReadonly();

  readonly current = computed<Project>(() => {
    const found = this.projects().find((project) => project.id === this.currentId());
    return found ?? this.projects()[0];
  });

  // --- 동작 --------------------------------------------------------------------------------------
  /**
   * 프로젝트를 세운다.
   *
   * <p>목이므로 채번을 여기서 한다. 서버가 서면 그 자리가 넘어간다.
   */
  create(name: string): string {
    const id = `p-${++this.sequence}`;
    const key = keyOf(name);

    this.projects.update((projects) => [
      ...projects,
      { id, name, key, issueCount: 0, docCount: 0 },
    ]);

    return id;
  }

  choose(id: string): void {
    this.currentId.set(id);
  }

  rename(name: string): void {
    const id = this.currentId();
    this.projects.update((projects) =>
      projects.map((project) => (project.id === id ? { ...project, name } : project)),
    );
  }

  unlink(linkId: string): void {
    this.links.update((links) => links.filter((link) => link.id !== linkId));
  }
}

/**
 * 이름에서 접두어를 뽑는다.
 *
 * <p>영문이면 앞 두 글자를, 그렇지 않으면 첫 글자를 쓴다. 번호가 매겨진 뒤에는 바꾸지 않으므로
 * 세울 때 한 번만 정한다.
 */
function keyOf(name: string): string {
  const trimmed = name.trim();
  const ascii = trimmed.replace(/[^A-Za-z]/g, '');

  return (ascii.length >= 2 ? ascii.slice(0, 2) : trimmed.slice(0, 2)).toUpperCase();
}
