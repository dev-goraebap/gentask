import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ENDPOINTS, type MeView } from '@/shared/api';
import { ROUTES } from '@/shared/config';

export const authGuard: CanActivateFn = async () => {
  if (isPlatformServer(inject(PLATFORM_ID))) return true;

  const httpClient = inject(HttpClient);
  const router = inject(Router);
  try {
    await firstValueFrom(httpClient.get(ENDPOINTS.me));
    return true;
  } catch {
    return router.parseUrl(ROUTES.login());
  }
};

/**
 * 관리자만 지난다.
 *
 * 서버가 같은 판정을 인터셉터에서 다시 한다. 이 자리는 관리자가 아닌 사람에게 빈 화면 대신 자기
 * 자리를 보여 주기 위한 것이며, 접근을 막는 근거는 서버가 갖는다.
 */
export const adminGuard: CanActivateFn = async () => {
  if (isPlatformServer(inject(PLATFORM_ID))) return true;

  const httpClient = inject(HttpClient);
  const router = inject(Router);
  try {
    const me = await firstValueFrom(httpClient.get<MeView>(ENDPOINTS.me));
    return me.role === 'ADMIN' ? true : router.parseUrl(ROUTES.taskList());
  } catch {
    return router.parseUrl(ROUTES.login());
  }
};
