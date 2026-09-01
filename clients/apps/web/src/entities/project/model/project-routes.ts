import { computed, inject, type Signal } from '@angular/core';
import { ROUTES } from '@/shared/config';
import { ProjectService } from '../api/project-service';

/**
 * 지금 프로젝트가 이미 박힌 주소 만들개.
 *
 * <p>트래커의 자리는 전부 프로젝트 아래에 있으므로, 링크를 그리는 자리마다 프로젝트를 다시 들고
 * 다니면 그 값을 넘기는 것을 한 곳만 빠뜨려도 다른 프로젝트로 새는 링크가 생깁니다. 그 값을 여기서
 * 한 번만 읽습니다.
 */
export interface ProjectRoutes {
  issues(): string;
  issue(id: string): string;
  docs(): string;
  doc(id: string): string;
  settings(): string;
}

export function injectProjectRoutes(): Signal<ProjectRoutes> {
  const projectService = inject(ProjectService);

  return computed<ProjectRoutes>(() => {
    const projectId = projectService.current().id;

    return {
      issues: () => ROUTES.issues(projectId),
      issue: (id: string) => ROUTES.issue(projectId, id),
      docs: () => ROUTES.docs(projectId),
      doc: (id: string) => ROUTES.doc(projectId, id),
      settings: () => ROUTES.projectSettings(projectId),
    };
  });
}
