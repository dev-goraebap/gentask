import { BreakpointObserver } from '@angular/cdk/layout';
import { isPlatformBrowser } from '@angular/common';
import { computed, inject, PLATFORM_ID, type Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

/**
 * 뷰포트 폭을 판정합니다.
 *
 * 포인터와 호버 미디어 쿼리를 쓰지 않습니다. 브라우저가 마우스 연결 여부를 그 값으로
 * 신뢰성 있게 보고하지 않으며, 그 오판은 애플리케이션 코드로 교정할 수 없습니다.
 * 실측과 기각 사유는 docs/architecture/references/07-adaptive-ui.md 2절입니다.
 *
 * 컴포넌트가 미디어 쿼리 문자열을 직접 갖는 것을 금지하며 이 함수만 사용합니다.
 * 판정 기준이 바뀌면 이 파일 하나만 고칩니다.
 *
 * 치수 조정에는 이 함수를 쓰지 않습니다. `pointer-coarse:` 변형이 미디어 쿼리로
 * 컴파일되므로 CSS 만으로 해결되며 정적 생성 경로에서도 그대로 동작합니다.
 */
export function injectViewportClass(): Signal<'wide' | 'compact'> {
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  const observer = inject(BreakpointObserver);
  const state = toSignal(observer.observe(WIDE), { initialValue: null });

  return computed(() => {
    // 서버의 noopMatchMedia 는 이 쿼리에도 false 를 내보냅니다. 그대로 두면 compact 가
    // 되어 넓은 화면의 첫 페인트가 시트가 됩니다. 07-adaptive-ui.md 3.2절.
    if (!isBrowser) return 'wide';

    return state()?.matches ? 'wide' : 'compact';
  });
}

/** Tailwind 의 `md` 경계입니다. 척도 위의 값만 씁니다. */
const WIDE = '(min-width: 48rem)';
