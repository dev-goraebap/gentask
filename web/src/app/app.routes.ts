import { Routes } from '@angular/router';
/*
 * 프로바이더는 슬라이스 배럴이 아니라 전용 진입점에서 가져옵니다.
 *
 * 같은 배럴을 즉시 임포트와 지연 임포트가 함께 쓰면 배럴 모듈이 정적 의존으로 확정되어
 * 지연 청크가 재수출 껍데기만 남고 화면 코드가 초기 번들로 들어갑니다. 실측으로 확인했으며
 * 근거와 수치는 01-dev-environment.md 7절에 있습니다.
 */
import { TaskCommands, TaskList } from '@/entities/task/providers';
import { authGuard } from '@/entities/user/guard';
import { AuthCommands, CurrentUser, MeCommands } from '@/entities/user/providers';
import { provideTaskListDatePicker } from '@/pages/task-list/providers';
import { AppShell } from './layout/app-shell';

/**
 * 라우트 정의는 이 파일이 단독으로 소유합니다. pages 슬라이스가 자신의 경로를 정의하지 않습니다.
 *
 * 모든 화면 라우트는 지연 로딩하며 예외를 두지 않습니다. 정적 생성 경로의 청크는 빌드가
 * modulepreload 힌트를 심어 초기 번들과 병렬로 받으므로 첫 표시가 늦어지지 않습니다.
 * 근거는 docs/architecture/references/08-routing.md 2절입니다.
 */
export const routes: Routes = [
  /*
   * 로그인 전에도 닿아야 하는 화면들은 셸 밖에 둡니다. 셸은 네비게이션과 프로필 자리를
   * 갖는데, 그 자리들이 전부 로그인 뒤의 것입니다. TK-005.
   */
  {
    path: 'login',
    providers: [AuthCommands],
    loadComponent: () => import('@/pages/login').then((m) => m.LoginPage),
  },
  {
    path: 'signup',
    providers: [AuthCommands],
    loadComponent: () => import('@/pages/signup').then((m) => m.SignupPage),
  },
  {
    path: '',
    component: AppShell,
    // 로그인 없이 접근하면 로그인 자리로 갑니다. 화면 사용 중의 만료는 401 인터셉터가 받습니다.
    canActivate: [authGuard],
    /*
     * 로그인한 사용자의 사본과 계정 명령. 셸로 들어올 때마다 새로 받고 나가면 버려져
     * 로그아웃 뒤 낡은 프로필이 남지 않습니다. 02-package-structure.md 7.5절.
     */
    providers: [CurrentUser, MeCommands, AuthCommands],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tasks' },
      {
        path: 'account',
        loadComponent: () => import('@/pages/account').then((m) => m.AccountPage),
      },
      {
        /*
         * 프로바이더를 이 자리에 두면 하위 화면들이 한 인스턴스를 공유합니다. 상세 화면이
         * 생겨도 목록과 같은 데이터를 보게 됩니다. 02-package-structure.md 7.5절.
         *
         * 조회의 수명이 이 구역과 같아집니다. tasks 를 떠나면 TaskList 가 파괴되어 낡은
         * 사본이 남지 않고, 관점(:view)이 바뀌어도 이 라우트는 다시 활성화되지 않으므로
         * 관점을 옮길 때 재조회가 일어나지 않습니다.
         */
        path: 'tasks',
        providers: [TaskList, TaskCommands, ...provideTaskListDatePicker()],
        children: [
          /*
           * 관점을 경로 파라미터로 둡니다. 네 관점이 같은 라우트를 공유하므로 관점을 바꿔도
           * 라우터가 화면을 다시 만들지 않고, 열려 있던 상세 패널이 그대로 남습니다.
           *
           * 관점 없는 주소는 전체로 넘깁니다. 같은 화면을 가리키는 주소가 두 벌이 되면
           * 공유된 링크가 갈립니다.
           */
          { path: '', pathMatch: 'full', redirectTo: 'all' },
          {
            /*
             * 상세는 별도 라우트가 아니라 이 화면이 여는 패널입니다. 경로가 바뀌면 라우터가
             * 목록을 언마운트해 곁에 둘 수 없습니다. 열린 항목은 쿼리 파라미터가 갖습니다.
             */
            path: ':view',
            loadComponent: () => import('@/pages/task-list').then((m) => m.TaskListPage),
          },
        ],
      },
    ],
  },
];
