import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse, type HttpHandlerFn, type HttpRequest } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ROUTES } from '@/shared/config';

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
