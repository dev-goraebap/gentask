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
  // 복구 흐름 (AUTH-07·08) — 로그인할 수 없는 사용자를 위한 경로다. 가드를 걸지 않는다:
  // requireGuest를 걸면 다른 기기에서 로그인해 둔 사용자가 재설정 화면에 들어오지 못한다.
  {
    path: 'password-reset',
    loadComponent: () => import('@/pages/password-reset').then((m) => m.PasswordResetPage),
  },
  {
    path: 'account-recovery',
    loadComponent: () => import('@/pages/account-recovery').then((m) => m.AccountRecoveryPage),
  },
  // 소셜 로그인 (AUTH-02·03·05). 서버가 제공자 인증을 마친 뒤 이 세 주소로 리다이렉트한다
  // (설계/인프라.md §2.2 — 이들은 프록시가 서버로 넘기지 않고 화면이 처리한다).
  {
    path: 'auth/social/email',
    canActivate: [requireGuest],
    loadComponent: () => import('@/pages/social-email').then((m) => m.SocialEmailPage),
  },
  {
    // 가드를 걸지 않는다 — 이 화면의 일이 곧 "세션이 생겼는지 확인하는 것"이라
    // requireGuest를 걸면 성공한 사용자를 가드가 먼저 낚아채 화면이 하는 일이 사라진다
    path: 'auth/complete',
    loadComponent: () => import('@/pages/social-complete').then((m) => m.SocialCompletePage),
  },
  {
    path: 'auth/error',
    loadComponent: () => import('@/pages/social-error').then((m) => m.SocialErrorPage),
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
