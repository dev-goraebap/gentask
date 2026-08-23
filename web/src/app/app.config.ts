import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // 처리되지 않은 예외를 포착합니다. 15-error-handling.md 4절.
    provideBrowserGlobalErrorListeners(),

    // 변경 요청이 쓰는 클라이언트입니다. 조회는 리졸버와 httpResource 가 이것을 거칩니다.
    // withFetch 는 서버 렌더 중의 요청을 fetch 로 보내 하이드레이션이 그 결과를 물려받게 합니다.
    provideHttpClient(withFetch()),

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
