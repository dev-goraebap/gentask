import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ENDPOINTS } from '@/shared/api';
import { ROUTES } from '@/shared/config';

/**
 * 로그인 없이 접근하면 로그인 자리로 안내합니다 (TK-005 A5).
 *
 * 서버(정적 생성)에서는 통과시킵니다. 백엔드 없이 도는 빌드 단계라 확인할 수 없고,
 * 클라이언트가 뜨면 같은 가드가 다시 돕니다.
 *
 * 라우트 정의가 즉시 임포트하는 파일이라 배럴이 아니라 전용 진입점으로 나갑니다.
 * 01-dev-environment.md 7절.
 */
export const authGuard: CanActivateFn = async () => {
  if (isPlatformServer(inject(PLATFORM_ID))) return true;

  const http = inject(HttpClient);
  const router = inject(Router);
  try {
    await firstValueFrom(http.get(ENDPOINTS.me));
    return true;
  } catch {
    return router.parseUrl(ROUTES.login());
  }
};
