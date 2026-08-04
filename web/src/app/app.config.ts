import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { errorInterceptor } from '@/shared/api';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // 리졸버 결과와 쿼리 파라미터를 컴포넌트 input()으로 받는다 — ActivatedRoute를 주입하지
    // 않기 위한 전제다(설계/웹.md §6.1)
    provideRouter(routes, withComponentInputBinding()),
    provideClientHydration(),
    // withFetch: SSR에서 요청이 중복되지 않게 하는 전제이자 XHR 없이 도는 경로다.
    // errorInterceptor: 모든 HTTP 실패를 ApiError로 정규화한다(shared/api).
    provideHttpClient(withFetch(), withInterceptors([errorInterceptor])),
  ],
};
