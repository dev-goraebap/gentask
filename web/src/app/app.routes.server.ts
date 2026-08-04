import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * 렌더링 모드 — 경계는 URL 접두사로 긋는다 (설계/웹.md §5, 결정-0011).
 *
 * **인증 후 화면을 추가할 때 이 파일을 건드리지 않는다.** `app/` 아래에 라우트만 넣으면
 * 모드가 따라온다. 공개 페이지를 추가할 때만 여기에 한 줄이 는다 — 프리렌더는 빌드 시점에
 * 주소를 알아야 하기 때문이다.
 *
 * 주의: 프리렌더는 **빌드 시점 값이 구워진다.** 런타임 설정(OAuth 클라이언트 ID 등)에
 * 의존하는 공개 페이지가 생기면 그 값을 API로 받거나 `RenderMode.Server`로 바꾼다.
 */
export const serverRoutes: ServerRoute[] = [
  // 공개 — SEO·초기 로딩이 중요하고 사용자별 데이터가 없다
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'signup', renderMode: RenderMode.Prerender },

  // 인증 이후 — SEO 불필요, 인터랙티브. 서버는 껍데기만 내려보낸다.
  // `app`과 `app/**`를 함께 적는 것은 하위 경로가 생겨도 규칙이 따라오게 하기 위함이다.
  { path: 'app', renderMode: RenderMode.Client },
  { path: 'app/**', renderMode: RenderMode.Client },

  // 그 외 — 리다이렉트(`/`)와 아직 없는 주소가 여기로 온다
  { path: '**', renderMode: RenderMode.Server },
];
