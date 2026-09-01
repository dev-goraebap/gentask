import { InjectionToken, type Signal } from '@angular/core';

/**
 * 지금 프로젝트의 접두어.
 *
 * <p>트래커의 자리는 전부 프로젝트 하나에 매이므로 그 값을 여러 슬라이스가 읽는다. 슬라이스가 서로를
 * 직접 참조하면 FSD 가 막으므로(같은 층의 가로지르기), 라우트가 이 자리에 내려 준다.
 *
 * <p>아직 실리지 않았으면 비어 있다. 받는 쪽은 그동안 아무것도 묻지 않는다.
 */
export const CURRENT_PROJECT_KEY = new InjectionToken<Signal<string | undefined>>(
  'CURRENT_PROJECT_KEY',
);
