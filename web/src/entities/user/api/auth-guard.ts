import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ENDPOINTS } from '@/shared/api';
import { ROUTES } from '@/shared/config';

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
