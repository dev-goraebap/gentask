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
 * <p>없는 프로젝트를 가리키면 홈으로 보냅니다. 프로젝트 목록이 거기 있으므로 고를 수 있고, 기본
 * 프로젝트로 몰래 바꾸면 주소와 보이는 것이 어긋납니다.
 */
export const projectScopeGuard: CanActivateFn = async (route) => {
  const projectService = inject(ProjectService);
  const router = inject(Router);

  const projectId = route.paramMap.get('projectId');
  if (projectId === null) return router.parseUrl(ROUTES.home());

  // 목록이 실릴 때까지 기다린다. 처음 여는 순간에는 아직 비어 있어, 기다리지 않으면 제 프로젝트를
  // 없는 것으로 보고 첫 자리로 되돌린다.
  const projects = await projectService.ready();
  if (!projects.some((project) => project.id === projectId)) return router.parseUrl(ROUTES.home());

  projectService.choose(projectId);

  return true;
};
