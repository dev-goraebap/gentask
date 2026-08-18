import { Routes } from '@angular/router';
/*
 * 프로바이더는 슬라이스 배럴이 아니라 전용 진입점에서 가져옵니다.
 *
 * 같은 배럴을 즉시 임포트와 지연 임포트가 함께 쓰면 배럴 모듈이 정적 의존으로 확정되어
 * 지연 청크가 재수출 껍데기만 남고 화면 코드가 초기 번들로 들어갑니다. 실측으로 확인했으며
 * 근거와 수치는 01-dev-environment.md 7절에 있습니다.
 */
import { provideTaskList } from '@/pages/task-list/providers';
import { AppShell } from './layout/app-shell';

/**
 * 라우트 정의는 이 파일이 단독으로 소유합니다. pages 슬라이스가 자신의 경로를 정의하지 않습니다.
 *
 * 모든 화면 라우트는 지연 로딩하며 예외를 두지 않습니다. 정적 생성 경로의 청크는 빌드가
 * modulepreload 힌트를 심어 초기 번들과 병렬로 받으므로 첫 표시가 늦어지지 않습니다.
 * 근거는 docs/architecture/references/08-routing.md 2절입니다.
 */
export const routes: Routes = [
  {
    path: '',
    component: AppShell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tasks' },
      {
        // 프로바이더를 이 자리에 두면 하위 화면들이 한 인스턴스를 공유합니다. 상세 화면이
        // 생겨도 목록과 같은 데이터를 보게 됩니다. 02-package-structure.md 7.5절.
        path: 'tasks',
        providers: [...provideTaskList()],
        children: [
          {
            path: '',
            loadComponent: () => import('@/pages/task-list').then((m) => m.TaskList),
          },
        ],
      },
    ],
  },
];
