import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  Router,
} from '@angular/router';

import { UiSpinner } from '@/shared/ui';

/** 임계 시간 (설계/웹.md §6.2, 결정-0012 §3). 이 안에 끝나는 전환에는 아무것도 띄우지 않는다. */
const 임계시간MS = 150;

/**
 * 전환 오버레이 — 느린 전환에만 나타난다.
 *
 * 게이트가 없으면 빠른 전환에서 오버레이가 떴다 사라지며 깜빡인다. 페이드 아웃에도 시간이
 * 걸리므로 오히려 더 도드라진다.
 *
 * ```
 * 전환 시작 → 타이머 시작(150ms)
 *   ├─ 만료 전 종료 → 오버레이 표시 안 함
 *   └─ 만료 → 오버레이 표시 → 전환 종료 시 즉시 해제
 * ```
 *
 * 요소를 지웠다 만들지 않고 투명도만 바꾼다 — 삽입되는 요소에는 CSS 전환이 걸리지 않아
 * 페이드가 생기지 않는다. 보이지 않는 동안에는 `aria-hidden`으로 접근성 트리에서도 빠진다.
 *
 * **브라우저에서만 동작한다.** 서버 렌더 중에 타이머를 걸면 렌더가 그 타이머를 기다린다.
 */
@Component({
  selector: 'app-transition-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiSpinner],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-overlay transition-opacity duration-200"
      [class]="visible() ? 'opacity-100' : 'pointer-events-none opacity-0'"
      [attr.aria-hidden]="visible() ? null : 'true'"
    >
      @if (visible()) {
        <ui-spinner size="lg" label="화면을 불러오는 중" />
      }
    </div>
  `,
})
export class TransitionOverlay {
  protected readonly visible = signal(false);

  constructor() {
    const router = inject(Router);

    if (!isPlatformBrowser(inject(PLATFORM_ID))) {
      return;
    }

    let 타이머: ReturnType<typeof setTimeout> | undefined;
    const 해제 = () => {
      clearTimeout(타이머);
      this.visible.set(false);
    };

    const 구독 = router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        clearTimeout(타이머);
        타이머 = setTimeout(() => this.visible.set(true), 임계시간MS);
        return;
      }
      // 취소·실패도 반드시 해제한다 — 빠뜨리면 오버레이가 영원히 남아 화면이 잠긴다
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError ||
        event instanceof NavigationSkipped
      ) {
        해제();
      }
    });

    inject(DestroyRef).onDestroy(() => {
      구독.unsubscribe();
      clearTimeout(타이머);
    });
  }
}
