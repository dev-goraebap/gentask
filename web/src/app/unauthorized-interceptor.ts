import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse, type HttpHandlerFn, type HttpRequest } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ROUTES } from '@/shared/config';

/**
 * 세션이 풀린 채 온 401 을 로그인 자리로 보냅니다 (TK-005 A5).
 *
 * 가드는 진입만 지키고, 화면이 떠 있는 동안 만료된 세션은 이쪽이 받습니다. 인증 경로의
 * 401(자격 불일치)은 로그인 화면 자신의 일이라 건드리지 않습니다.
 */
export function unauthorizedInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn) {
  const router = inject(Router);
  const browser = isPlatformBrowser(inject(PLATFORM_ID));

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        browser &&
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !request.url.includes('/api/v1/auth/')
      ) {
        void router.navigateByUrl(ROUTES.login());
      }
      return throwError(() => error);
    }),
  );
}
