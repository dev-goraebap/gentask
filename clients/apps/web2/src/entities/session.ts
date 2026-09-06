import { ApiError, api, type MeView } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';

/**
 * 세션은 쿠키가 갖는다. 화면은 `/me` 응답으로 신원을 안다.
 *
 * 라우트마다 다시 물으면 화면을 옮길 때마다 왕복이 생기므로 한 번 받은 것을 들고 있다가
 * 로그인과 로그아웃 시점에만 버린다.
 */
let cached: Promise<MeView | null> | null = null;

export function loadSession(): Promise<MeView | null> {
  cached ??= api
    .get<MeView>(ENDPOINTS.me)
    .catch((error: unknown) => {
      // 401 은 로그인하지 않은 상태다. 오류가 아니라 사실이므로 null 로 바꾼다.
      if (error instanceof ApiError && error.status === 401) return null;
      // 그 밖의 실패는 캐시에 남기지 않는다. 남기면 서버가 돌아와도 계속 실패한다.
      cached = null;
      throw error;
    });
  return cached;
}

export function clearSession(): void {
  cached = null;
}

export async function login(email: string, password: string): Promise<MeView | null> {
  await api.post(ENDPOINTS.login, { email, password });
  clearSession();
  return loadSession();
}

export async function logout(): Promise<void> {
  await api.post(ENDPOINTS.logout);
  clearSession();
}
