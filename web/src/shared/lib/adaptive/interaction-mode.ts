import { BreakpointObserver } from '@angular/cdk/layout';
import { computed, inject, type Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

/**
 * 기기의 상호작용 특성을 판정합니다.
 *
 * 판정 축이 화면 너비가 아닌 이유는 액션시트가 필요한 이유가 화면이 작아서가 아니라
 * 손가락으로 조작하고 호버가 없기 때문입니다. 너비로 판정하면 터치 노트북과
 * 태블릿 가로, 좁게 줄인 데스크탑 창이 모두 오판됩니다.
 * 근거는 docs/architecture/references/07-adaptive-ui.md 2절입니다.
 *
 * 컴포넌트가 미디어 쿼리 문자열을 직접 갖는 것을 금지하며 이 함수만 사용합니다.
 * 판정 기준이 바뀌면 이 파일 하나만 고칩니다.
 *
 * 치수 조정에는 이 함수를 쓰지 않습니다. `pointer-coarse:` 변형이 미디어 쿼리로
 * 컴파일되므로 CSS 만으로 해결되며 정적 생성 경로에서도 그대로 동작합니다.
 */
export function injectInteractionMode(): Signal<'pointer' | 'touch'> {
  const observer = inject(BreakpointObserver);
  const state = toSignal(observer.observe([POINTER_COARSE, HOVER_NONE]), { initialValue: null });

  return computed(() => {
    const current = state();

    // 방어용입니다. 서버에서도 CDK 가 noopMatchMedia 로 실제 상태 객체를 즉시 방출하므로
    // 이 분기는 서버 렌더 경로에서 도달하지 않습니다. 07-adaptive-ui.md 3.2절.
    if (!current) return 'pointer';

    return current.breakpoints[POINTER_COARSE] && current.breakpoints[HOVER_NONE]
      ? 'touch'
      : 'pointer';
  });
}

const POINTER_COARSE = '(pointer: coarse)';
const HOVER_NONE = '(hover: none)';
