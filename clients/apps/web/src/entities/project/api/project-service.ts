import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENDPOINTS } from '@/shared/api';
import {
  REPOSITORY_HOSTS,
  REPOSITORY_STATES,
  type Project,
  type RepositoryLink,
} from '../model/project';

/**
 * 이어 둔 저장소는 아직 목이다.
 *
 * <p>잇는 규격(무엇을 받아 어떻게 확인하는가)이 정해지지 않아 서버에 자리가 없다. 화면이 그 자리를
 * 이미 갖고 있으므로 여기서만 목으로 남긴다.
 */
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

/** 서버가 내는 모양. 문서 수는 아직 서버에 자리가 없다. */
interface ProjectResponse {
  /** 주소가 담는 값. 내부의 UUID 가 아니다. */
  readonly id: string;
  readonly name: string;
  readonly key: string;
  readonly issueCount: number;
}

/**
 * 프로젝트.
 *
 * <p>리소스(`httpResource`)를 쓰지 않는다. 길잡이가 주소의 접두어를 판정하려면 목록을 **기다려야**
 * 하는데 리소스는 신호이지 약속이 아니다. 실어 오는 약속을 하나만 두고 그것을 함께 기다린다 —
 * 리소스와 기다림을 함께 두면 처음 드는 순간에 같은 것을 두 번 부른다.
 */
@Injectable()
export class ProjectService {
  // --- 의존 --------------------------------------------------------------------------------------
  private readonly httpClient = inject(HttpClient);
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));

  // --- 상태 --------------------------------------------------------------------------------------
  private readonly projects = signal<readonly Project[]>([]);
  private readonly links = signal<readonly RepositoryLink[]>(LINKS);

  /** 지금 프로젝트의 식별자. 주소가 이것의 진실이며 길잡이가 맞춰 준다. */
  private readonly currentId = signal<string | null>(null);

  /** 실어 오는 중인 약속. 여럿이 기다려도 요청은 하나다. */
  private loading: Promise<readonly Project[]> | null = null;

  // --- 파생 --------------------------------------------------------------------------------------
  readonly list = this.projects.asReadonly();
  readonly repositories = this.links.asReadonly();

  /**
   * 지금 프로젝트.
   *
   * <p>아직 하나도 실리지 않았을 수 있다. 그때는 비어 있는 것을 내며, 화면은 목록이 빈 동안을 그
   * 자리의 빈 화면으로 가린다.
   */
  readonly current = computed<Project | undefined>(() => {
    const projects = this.projects();
    const id = this.currentId();
    return projects.find((project) => project.id === id) ?? projects[0];
  });

  // --- 생성 --------------------------------------------------------------------------------------
  constructor() {
    // 서버에서 그리는 동안은 부르지 않는다. 쿠키가 실리지 않아 어차피 거절된다.
    if (!this.isServer) void this.ready();
  }

  // --- 동작 --------------------------------------------------------------------------------------
  /** 목록이 한 번 실릴 때까지 기다린다. 길잡이가 판정하기 전에 이것을 지난다. */
  ready(): Promise<readonly Project[]> {
    this.loading ??= this.load();
    return this.loading;
  }

  /**
   * 프로젝트를 세우고 주소가 담을 식별자를 낸다.
   *
   * <p>접두어는 사람이 정한다. 이름에서 뽑던 규칙을 걷었으므로 세울 때 함께 보낸다.
   */
  async create(name: string, key: string): Promise<string> {
    const created = await firstValueFrom(
      this.httpClient.post(ENDPOINTS.projects, { name, key }, { observe: 'response' }),
    );
    await this.reload();

    const location = created.headers.get('Location') ?? '';
    return location.slice(location.lastIndexOf('/') + 1);
  }

  choose(id: string): void {
    this.currentId.set(id);
  }

  /** 넘긴 것만 바꾼다. 접두어를 바꿔도 이미 매겨진 번호는 그대로다. */
  async edit(fields: { name?: string; key?: string }): Promise<void> {
    const id = this.current()?.id;
    if (id === undefined) return;

    await firstValueFrom(this.httpClient.patch(ENDPOINTS.project(id), fields));
    await this.reload();
  }

  unlink(linkId: string): void {
    this.links.update((links) => links.filter((link) => link.id !== linkId));
  }

  // --- 내부 --------------------------------------------------------------------------------------
  private async reload(): Promise<void> {
    this.loading = this.load();
    await this.loading;
  }

  private async load(): Promise<readonly Project[]> {
    const response = await firstValueFrom(
      this.httpClient.get<readonly ProjectResponse[]>(ENDPOINTS.projects),
    );
    const projects = response.map(toProject);
    this.projects.set(projects);
    return projects;
  }
}

/** 문서 수는 아직 서버가 내지 않는다. 화면이 그 칸을 갖고 있어 0 으로 채운다. */
function toProject(response: ProjectResponse): Project {
  return { ...response, docCount: 0 };
}
