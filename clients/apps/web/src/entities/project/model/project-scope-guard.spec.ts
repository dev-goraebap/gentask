import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  convertToParamMap,
  provideRouter,
  type RouterStateSnapshot,
  type UrlTree,
} from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ENDPOINTS } from '@/shared/api';
import { ProjectService } from '../api/project-service';
import { projectScopeGuard } from './project-scope-guard';

/** 주소가 담는 것은 접두어가 아니라 식별자다. 접두어는 겹칠 수 있으므로 가려내지 못한다. */
const PROJECTS = [
  { id: 'V1StGXR8_Z5j', name: 'gentask', key: 'GT', issueCount: 37 },
  { id: 'dHi6B-myT7pQ', name: '연습장', key: 'GT', issueCount: 4 },
];

describe('projectScopeGuard', () => {
  let projectService: ProjectService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), ProjectService],
    });
    projectService = TestBed.inject(ProjectService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  /** 목록이 실려야 길잡이가 판정한다. 서비스가 서면서 한 번만 부른다. */
  function flushList(): void {
    httpTesting.expectOne({ url: ENDPOINTS.projects, method: 'GET' }).flush(PROJECTS);
  }

  it('URL 경로의 프로젝트를 활성 프로젝트로 설정한다', async () => {
    const done = run('dHi6B-myT7pQ');
    flushList();

    expect(await done).toBe(true);
    expect(projectService.current()?.name).toBe('연습장');
  });

  /*
   * 기본 프로젝트로 몰래 바꾸지 않는다. 그러면 주소는 없는 것을 가리키는데 보이는 것은 다른
   * 프로젝트가 되어, 그 주소를 건네받은 사람이 서로 다른 것을 본다. 홈에 목록이 있으므로 거기서
   * 고르게 한다.
   */
  it('없는 프로젝트를 가리키면 홈으로 보낸다', async () => {
    const done = run('AAAAAAAAAAAA');
    flushList();

    expect(String(await done)).toBe('/');
    expect(projectService.current()?.name).toBe('gentask');
  });

  /*
   * 목록이 아직 실리지 않은 순간에 판정하면 제 프로젝트를 없는 것으로 본다. 기다린 뒤에 본다.
   */
  it('목록이 실리기 전에 들어도 되돌리지 않는다', async () => {
    const done = run('dHi6B-myT7pQ');
    flushList();

    expect(await done).toBe(true);
  });

  it('프로젝트를 가리키지 않아도 홈으로 보낸다', async () => {
    expect(String(await run(null))).toBe('/');
    flushList();
  });
});

function run(projectId: string | null): Promise<boolean | UrlTree> {
  const route = {
    paramMap: convertToParamMap(projectId === null ? {} : { projectId }),
  } as ActivatedRouteSnapshot;

  return TestBed.runInInjectionContext(
    () => projectScopeGuard(route, {} as RouterStateSnapshot) as Promise<boolean | UrlTree>,
  );
}
