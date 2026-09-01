import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  convertToParamMap,
  provideRouter,
  type RouterStateSnapshot,
  type UrlTree,
} from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { ProjectService } from '../api/project-service';
import { projectScopeGuard } from './project-scope-guard';

describe('projectScopeGuard', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([]), ProjectService] });
  });

  it('주소가 가리키는 프로젝트를 지금 프로젝트로 삼는다', () => {
    const projectService = TestBed.inject(ProjectService);
    expect(projectService.current().id).toBe('gentask');

    expect(run('sandbox')).toBe(true);
    expect(projectService.current().id).toBe('sandbox');
  });

  /*
   * 기본 프로젝트로 몰래 바꾸지 않는다. 그러면 주소는 없는 것을 가리키는데 보이는 것은 다른
   * 프로젝트가 되어, 그 주소를 건네받은 사람이 서로 다른 것을 본다.
   */
  it('없는 프로젝트를 가리키면 프로젝트들로 보낸다', () => {
    const projectService = TestBed.inject(ProjectService);

    expect(String(run('없는것'))).toBe('/projects');
    expect(projectService.current().id).toBe('gentask');
  });

  it('프로젝트를 가리키지 않아도 프로젝트들로 보낸다', () => {
    expect(String(run(null))).toBe('/projects');
  });
});

function run(projectId: string | null): boolean | UrlTree {
  const route = {
    paramMap: convertToParamMap(projectId === null ? {} : { projectId }),
  } as ActivatedRouteSnapshot;

  return TestBed.runInInjectionContext(
    () => projectScopeGuard(route, {} as RouterStateSnapshot) as boolean | UrlTree,
  );
}
