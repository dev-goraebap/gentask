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

  // --- 파생 --------------------------------------------------------------------------------------
  readonly list = this.projects.asReadonly();
  readonly repositories = this.links.asReadonly();

  readonly current = computed<Project>(() => {
    const found = this.projects().find((project) => project.id === this.currentId());
    return found ?? this.projects()[0];
  });

  // --- 동작 --------------------------------------------------------------------------------------
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
