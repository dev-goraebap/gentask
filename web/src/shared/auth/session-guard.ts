import { inject } from '@angular/core';
import { CanActivateFn, ResolveFn, Router } from '@angular/router';

import type { CurrentSession, UserSession } from './session';
import { SessionApi } from './session-api';
import { SessionStore } from './session-store';

/** 로그인 화면이 읽는 쿼리 파라미터. 이름을 한 곳에 두어 화면과 가드가 어긋나지 않게 한다. */
export const RETURN_URL_PARAM = 'returnUrl';
export const REASON_PARAM = 'reason';

/** 세션 확인 자체가 실패했음(로그아웃이 아니다). */
export const REASON_UNAVAILABLE = 'unavailable';

/**
 * 인증이 필요한 라우트 (설계/웹.md §6.4 — 401은 로그인으로 보내되 원래 경로를 보존한다).
 *
 * **세션 확인 실패를 로그아웃으로 바꾸지 않는다.** 서버가 죽었을 때 "로그인하세요"라고만 하면
 * 사용자는 자기 계정에 문제가 생겼다고 오해하고, 몇 번을 다시 로그인해도 같은 자리로 돌아온다.
 * 사유를 함께 넘겨 화면이 다른 문구를 쓰게 한다.
 *
 * 실패했을 때 그 자리에 머무는 편이 더 나은 경우도 있지만(§6.4의 5xx 행), 첫 진입에는 머물
 * 화면이 없다 — `false`를 돌려주면 빈 화면이 남는다. 전용 재시도 페이지는 후속 작업이다.
 */
export const requireSession: CanActivateFn = async (_route, state) => {
  const store = inject(SessionStore);
  const router = inject(Router);

  try {
    const session = await store.ensureLoaded();
    return session ? true : 로그인으로(router, state.url);
  } catch {
    return 로그인으로(router, state.url, REASON_UNAVAILABLE);
  }
};

/**
 * 이미 로그인한 사용자에게 보일 필요가 없는 라우트(로그인·가입).
 *
 * 확인에 실패하면 통과시킨다 — 세션을 모르는 상태에서 사용자를 앱으로 밀어 넣으면 그다음
 * 화면에서 다시 튕겨 나온다.
 */
export const requireGuest: CanActivateFn = async () => {
  const store = inject(SessionStore);
  const router = inject(Router);

  try {
    return (await store.ensureLoaded()) ? router.createUrlTree(['/app']) : true;
  } catch {
    return true;
  }
};

/**
 * 인증 후 화면의 진입 데이터 (설계/웹.md §6.1 — fetch-then-render).
 *
 * 가드가 이미 확인해 둔 값을 그대로 돌려주므로 왕복이 늘지 않는다. 컴포넌트는
 * `withComponentInputBinding()`으로 이 값을 입력으로 받아 **로딩 분기 없이** 그린다.
 */
export const resolveCurrentSession: ResolveFn<CurrentSession | null> = () =>
  inject(SessionStore).ensureLoaded();

/**
 * 기기 목록의 진입 데이터 (AUTH-06).
 *
 * 화면 안에서 가져오지 않고 리졸버에 두는 이유: **이 목록이 곧 화면의 뼈대**라서, 없으면
 * 그릴 것이 없다(웹.md §6.2의 "필수 데이터만 리졸버에" 기준을 충족한다).
 */
export const resolveActiveSessions: ResolveFn<UserSession[]> = () =>
  inject(SessionApi).activeSessions();

function 로그인으로(router: Router, 원래경로: string, 사유?: string) {
  return router.createUrlTree(['/login'], {
    queryParams: {
      [RETURN_URL_PARAM]: 원래경로,
      ...(사유 ? { [REASON_PARAM]: 사유 } : {}),
    },
  });
}
