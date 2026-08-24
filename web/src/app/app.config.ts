import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { unauthorizedInterceptor } from './unauthorized-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // 처리되지 않은 예외를 포착합니다. 15-error-handling.md 4절.
    provideBrowserGlobalErrorListeners(),

    // withFetch 가 서버 렌더 중의 조회를 HTML 에 실어 클라이언트가 다시 묻지 않게 합니다. 05-rendering.md 4절.
    // 세션이 풀린 401 은 인터셉터가 로그인 자리로 보냅니다. TK-005 A5.
    provideHttpClient(withFetch(), withInterceptors([unauthorizedInterceptor])),

    // 상태를 시그널로 통일합니다. 11-component-design.md 5절.
    provideZonelessChangeDetection(),

    provideRouter(
      routes,

      // 리졸버 결과와 라우트 파라미터를 컴포넌트 입력 시그널로 받습니다.
      // ActivatedRoute 구독보다 이쪽을 씁니다. 08-routing.md 3.1절.
      withComponentInputBinding(),

      // 문서 스크롤만 대상입니다. 내부 박스가 스크롤되는 골격에서는 동작하지 않으며
      // 그 경우 복원을 직접 구현해야 합니다. 06-layout.md 4.3절.
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),

    // withEventReplay 는 옵트인입니다. 하이드레이션 완료 전에 누른 클릭을 보관했다가
    // 완료 후 재생하므로 정적 생성된 공개 페이지에서 첫 클릭이 유실되지 않습니다.
    // 증분 하이드레이션은 Angular 22 에서 기본 활성화이므로 명시하지 않습니다.
    // 05-rendering.md 3.1절.
    provideClientHydration(withEventReplay()),
  ],
};
