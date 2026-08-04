import { TestBed } from '@angular/core/testing';

import { ApiError } from '@/shared/api';

import type { CurrentSession } from './session';
import { SessionApi } from './session-api';
import { SessionStore } from './session-store';

const 세션: CurrentSession = {
  userId: 'u-1',
  email: 'someone@example.com',
  nickname: null,
  expiresAt: '2026-09-01T00:00:00Z',
};

class 가짜세션API {
  현재세션결과: CurrentSession | Error = 세션;
  로그아웃결과: Error | null = null;
  조회횟수 = 0;
  로그아웃횟수 = 0;

  currentSession(): Promise<CurrentSession> {
    this.조회횟수 += 1;
    return this.현재세션결과 instanceof Error
      ? Promise.reject(this.현재세션결과)
      : Promise.resolve(this.현재세션결과);
  }

  logout(): Promise<void> {
    this.로그아웃횟수 += 1;
    return this.로그아웃결과 ? Promise.reject(this.로그아웃결과) : Promise.resolve();
  }
}

describe('SessionStore', () => {
  let api: 가짜세션API;
  let store: SessionStore;

  beforeEach(() => {
    api = new 가짜세션API();
    TestBed.configureTestingModule({
      providers: [{ provide: SessionApi, useValue: api }],
    });
    store = TestBed.inject(SessionStore);
  });

  it('AUTH-01 서버가 세션을 주면 로그인 상태가 된다', async () => {
    expect(await store.ensureLoaded()).toEqual(세션);
    expect(store.isAuthenticated()).toBe(true);
  });

  it('AUTH-01 401이면 비로그인으로 판정하고 다시 묻지 않는다', async () => {
    api.현재세션결과 = new ApiError('unauthorized', '로그인이 필요합니다.', 401);

    expect(await store.ensureLoaded()).toBeNull();
    expect(await store.ensureLoaded()).toBeNull();
    expect(api.조회횟수).toBe(1);
    expect(store.isAuthenticated()).toBe(false);
  });

  it('401이 아닌 실패를 로그아웃으로 바꾸지 않는다', async () => {
    // 서버가 죽은 것을 "로그아웃"으로 삼키면 사용자는 멀쩡한 세션을 잃었다고 오해한다.
    api.현재세션결과 = new ApiError('server', '서버 오류', 503);

    await expect(store.ensureLoaded()).rejects.toBeInstanceOf(ApiError);
    // 캐시하지 않으므로 다음 시도가 다시 서버에 묻는다
    await expect(store.ensureLoaded()).rejects.toBeInstanceOf(ApiError);
    expect(api.조회횟수).toBe(2);
  });

  it('AUTH-01 로그아웃하면 로컬 세션이 비워진다', async () => {
    await store.ensureLoaded();

    await store.logout();

    expect(api.로그아웃횟수).toBe(1);
    expect(store.session()).toBeNull();
  });

  it('AUTH-01 로그아웃 호출이 실패해도 로컬 세션은 비운다', async () => {
    await store.ensureLoaded();
    api.로그아웃결과 = new ApiError('server', '서버 오류', 503);

    // 사용자가 로그아웃을 눌렀는데 화면이 로그인 상태로 남는 것이 더 나쁘다
    await expect(store.logout()).rejects.toBeInstanceOf(ApiError);
    expect(store.session()).toBeNull();
  });

  it('refresh는 캐시를 버리고 서버에 다시 묻는다', async () => {
    await store.ensureLoaded();

    await store.refresh();

    expect(api.조회횟수).toBe(2);
  });
});
