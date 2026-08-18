import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * 경로별 렌더링 모드입니다.
 *
 * 정적 생성 대상은 명시적으로 열거한 경로만 받고 `**` 를 Client 로 두어 새 라우트가
 * 자동으로 안전한 쪽에 떨어지게 합니다. 근거는 docs/architecture/references/05-rendering.md 1절입니다.
 *
 * 할일 화면을 Client 로 두는 이유는 둘입니다. 인증이 붙을 화면을 프로토타입 구간에
 * Prerender 로 만들어 두면 나중에 정적 생성 목록과 적응형 컴포넌트 사용 여부를 함께
 * 되돌려야 하고(05-rendering.md 6절), 정적 생성 경로에서는 적응형 컴포넌트를 쓸 수 없어
 * 목록의 테이블↔카드 교체가 성립하지 않습니다(07-adaptive-ui.md 6절).
 *
 * RenderMode.Server 는 사용하지 않습니다. 요청 시 서버 렌더링이 값을 가지려면 서버가
 * 인증 상태를 알아야 하고, 이는 토큰을 httpOnly 쿠키로 강제해 백엔드 인증 방식을
 * 규정하게 됩니다.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
