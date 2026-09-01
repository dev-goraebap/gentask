import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { ROUTES } from '@/shared/config';
import { ProjectService } from '../api/project-service';

/**
 * 주소가 지금 프로젝트의 진실이다.
 *
 * <p>고르개가 서비스의 상태만 바꾸면 새로고침과 주소 건네기가 성립하지 않고, 주소와 서비스가 각각
 * 프로젝트를 가리켜 열림의 진실이 둘로 나뉩니다. 주소로 들어오는 자리에서 서비스를 맞춥니다.
 *
 * <p>없는 프로젝트를 가리키면 프로젝트들로 보냅니다. 목록에서 고르게 하는 것이 그 자리를 비워 두는
 * 것보다 낫고, 기본 프로젝트로 몰래 바꾸면 주소와 보이는 것이 어긋납니다.
 */
export const projectScopeGuard: CanActivateFn = (route) => {
  const projectService = inject(ProjectService);
  const router = inject(Router);

  const projectId = route.paramMap.get('projectId');
  const known = projectService.list().some((project) => project.id === projectId);

  if (projectId === null || !known) return router.parseUrl(ROUTES.projects());

  projectService.choose(projectId);

  return true;
};
