import { InjectionToken, type Signal } from '@angular/core';

/**
 * 현재 트래커 화면이 참조하는 프로젝트의 공개 식별자(NanoID) 주입 토큰이다.
 * FSD 계층 규칙을 준수하며 활성 프로젝트 ID를 하위 슬라이스에 전달하기 위해 사용한다(GT-60).
 */
export const CURRENT_PROJECT_ID = new InjectionToken<Signal<string | undefined>>(
  'CURRENT_PROJECT_ID',
);
