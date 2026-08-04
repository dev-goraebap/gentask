import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';

import { ApiError } from '@/shared/api';

import type { CurrentSession } from './session';
import { requireGuest, requireSession } from './session-guard';
import { SessionStore } from './session-store';

const 세션: CurrentSession = {
  userId: 'u-1',
  email: 'someone@example.com',
  nickname: '누군가',
  expiresAt: '2026-09-01T00:00:00Z',
};

function 가짜저장소(결과: CurrentSession | null | Error) {
  return {
    ensureLoaded: () => (결과 instanceof Error ? Promise.reject(결과) : Promise.resolve(결과)),
  };
}

function 배선(결과: CurrentSession | null | Error) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: SessionStore, useValue: 가짜저장소(결과) }],
  });
}

function 경로(결과: boolean | UrlTree): string {
  return typeof 결과 === 'boolean' ? String(결과) : TestBed.inject(Router).serializeUrl(결과);
}

const 라우트 = {} as ActivatedRouteSnapshot;
const 상태 = { url: '/app' } as RouterStateSnapshot;

/** 가드는 주입 문맥에서만 돌고, 선언 타입에 Observable이 섞여 있어 여기서 좁힌다. */
async function 실행(guard: CanActivateFn): Promise<boolean | UrlTree> {
  return (await TestBed.runInInjectionContext(() => guard(라우트, 상태))) as boolean | UrlTree;
}

describe('requireSession', () => {
  it('AUTH-01 세션이 있으면 통과시킨다', async () => {
    배선(세션);

    const 결과 = await 실행(requireSession);

    expect(결과).toBe(true);
  });

  it('AUTH-01 세션이 없으면 로그인으로 보내되 원래 경로를 보존한다', async () => {
    배선(null);

    const 결과 = await 실행(requireSession);

    // 보존하지 않으면 로그인 후 사용자가 처음 가려던 곳을 스스로 다시 찾아가야 한다
    expect(경로(결과)).toBe('/login?returnUrl=%2Fapp');
  });

  it('세션 확인 실패는 로그아웃과 구분해 사유를 넘긴다', async () => {
    배선(new ApiError('server', '서버 오류', 503));

    const 결과 = await 실행(requireSession);

    // 사유가 없으면 화면이 "로그인하세요"라고만 말해 사용자가 계정 문제로 오해한다
    expect(경로(결과)).toBe('/login?returnUrl=%2Fapp&reason=unavailable');
  });
});

describe('requireGuest', () => {
  it('AUTH-01 이미 로그인했으면 앱으로 보낸다', async () => {
    배선(세션);

    const 결과 = await 실행(requireGuest);

    expect(경로(결과)).toBe('/app');
  });

  it('세션 확인에 실패하면 로그인 화면을 보여준다', async () => {
    배선(new ApiError('offline', '연결 없음', 0));

    const 결과 = await 실행(requireGuest);

    expect(결과).toBe(true);
  });
});
