import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { ProjectService } from '@/entities/project/providers';
import { routes } from './app.routes';
import { unauthorizedInterceptor } from './unauthorized-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideHttpClient(withFetch(), withInterceptors([unauthorizedInterceptor])),

    provideZonelessChangeDetection(),

    provideRouter(
      routes,

      withComponentInputBinding(),

      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),

    provideClientHydration(withEventReplay()),

    /*
     * 프로젝트는 자리 하나에 매이지 않는다. 계정 자리의 목록과 트래커 자리의 화면들이 같은 것을
     * 보아야 하는데, 그 둘은 서로 다른 껍데기라 라우트에 두면 인스턴스가 갈린다. 갈리면 세운
     * 프로젝트가 그 자리를 떠나는 순간 사라진다.
     */
    ProjectService,
  ],
};
