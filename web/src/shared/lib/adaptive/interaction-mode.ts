import { BreakpointObserver } from '@angular/cdk/layout';
import { isPlatformBrowser } from '@angular/common';
import { computed, inject, PLATFORM_ID, type Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

/**
 * 기기의 상호작용 특성을 판정합니다.
 *
 * 주 포인터(`pointer` / `hover`)가 아니라 있는 입력 전체(`any-pointer` / `any-hover`)를
 * 봅니다. Windows 는 터치스크린이 있으면 마우스가 연결되어 있어도 주 포인터를
 * coarse · hover none 으로 보고하는 경우가 있어, 주 포인터만 보면 데스크탑에서도
 * 터치 표현이 뜹니다. 정밀한 포인터나 호버가 하나라도 있으면 pointer 입니다.
 * 근거는 docs/architecture/references/07-adaptive-ui.md 2절입니다.
 *
 * 컴포넌트가 미디어 쿼리 문자열을 직접 갖는 것을 금지하며 이 함수만 사용합니다.
 * 판정 기준이 바뀌면 이 파일 하나만 고칩니다.
 *
 * 치수 조정에는 이 함수를 쓰지 않습니다. `pointer-coarse:` 변형이 미디어 쿼리로
 * 컴파일되므로 CSS 만으로 해결되며 정적 생성 경로에서도 그대로 동작합니다.
 */
export function injectInteractionMode(): Signal<'pointer' | 'touch'> {
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  const observer = inject(BreakpointObserver);
  const state = toSignal(observer.observe([ANY_POINTER_FINE, ANY_HOVER_HOVER]), {
    initialValue: null,
  });

  return computed(() => {
    // 서버의 noopMatchMedia 는 두 쿼리를 모두 false 로 내보냅니다. 그것을 touch 로
    // 보면 07-adaptive-ui.md 3.2절의 서버 기본값 pointer 와 반대가 됩니다.
    if (!isBrowser) return 'pointer';

    const current = state();
    if (!current) return 'pointer';

    const hasFinePointer = current.breakpoints[ANY_POINTER_FINE];
    const canHover = current.breakpoints[ANY_HOVER_HOVER];

    if (hasFinePointer === true || canHover === true) return 'pointer';
    if (hasFinePointer === false && canHover === false) return 'touch';
    return 'pointer';
  });
}

const ANY_POINTER_FINE = '(any-pointer: fine)';
const ANY_HOVER_HOVER = '(any-hover: hover)';
