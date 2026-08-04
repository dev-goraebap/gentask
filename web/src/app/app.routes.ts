import { Routes } from '@angular/router';

import { requireGuest, requireSession, resolveCurrentSession } from '@/shared/auth';

/**
 * 라우트 정의는 `app/`이 소유하고, 각 라우트는 `pages/` 슬라이스를 지연 로딩한다
 * (설계/웹.md §4). 라우팅 설정 자체는 FSD의 슬라이스가 되지 않는다.
 *
 * 렌더링 모드는 여기가 아니라 `app.routes.server.ts`가 URL 접두사로 정한다(§5) — 라우트마다
 * 모드를 적으면 두 파일을 이중 관리하게 되어 반드시 어긋난다.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/app',
  },
  {
    path: 'login',
    canActivate: [requireGuest],
    loadComponent: () => import('@/pages/login').then((m) => m.LoginPage),
  },
  {
    path: 'signup',
    canActivate: [requireGuest],
    loadComponent: () => import('@/pages/signup').then((m) => m.SignupPage),
  },
  {
    path: 'app',
    canActivate: [requireSession],
    // 진입 데이터는 리졸버가 확보한다 — 페이지 안에 로딩 분기가 없다(설계/웹.md §6.1)
    resolve: { session: resolveCurrentSession },
    loadComponent: () => import('@/pages/home').then((m) => m.HomePage),
  },
  {
    // 전용 404 화면은 아직 없다(설계/웹.md §6.4). 없는 주소를 빈 화면으로 두는 것보다
    // 앱 입구로 보내는 편이 낫고, 로그인하지 않았으면 가드가 로그인으로 넘긴다.
    path: '**',
    redirectTo: '/app',
  },
];
