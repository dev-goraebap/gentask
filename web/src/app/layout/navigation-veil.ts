import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, PLATFORM_ID, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router,
} from '@angular/router';

/** 이 시간 안에 끝나면 베일을 띄우지 않습니다. 10-loading.md 4절. */
const WAIT_DELAY = 200;

/** 한 번 띄운 베일은 최소 이 시간 유지합니다. 즉시 사라지면 깜빡임이 됩니다. */
const WAIT_MIN = 400;

/**
 * 화면 전환 중 콘텐츠 영역을 덮습니다.
 *
 * 전환을 기다리는 동안 이전 화면을 유지해 맥락을 지키는 장치입니다. 반쯤 채워진 화면과
 * 순차적 레이아웃 이동을 허용하지 않는다는 원칙의 구현이며, 스켈레톤을 대신합니다.
 * 근거는 docs/architecture/references/10-loading.md 1절입니다.
 *
 * 시간 정책을 이 자리에 두는 이유는 화면마다 다른 값을 쓰면 같은 대기가 화면에 따라
 * 다르게 보이기 때문입니다. 개별 화면이 베일을 띄우거나 걷는 것을 금지합니다(7.1절).
 *
 * 경로가 바뀌면 베일이고 쿼리만 바뀌면 인디케이터입니다. 사람이 "이건 전환인가 갱신인가"를
 * 판단하지 않고 URL 의 경로 부분을 비교해 계산합니다(3.1절). 필터를 쿼리 파라미터에
 * 두기로 한 결정이 이 판정을 성립시킵니다.
 *
 * 화면 전체가 아니라 콘텐츠 영역만 덮습니다. 대기 중에도 다른 화면으로 이동할 수 있어야
 * 하므로 상단 바는 덮지 않으며, 그래서 `position: fixed` 가 아니라 놓는 쪽이 지정한
 * 기준 상자 안에서 `absolute` 로 펼칩니다.
 */
@Component({
  selector: 'app-navigation-veil',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <!-- 가림막 자체는 읽을 것이 없습니다. 대기 사실은 호스트의 aria-busy 가 전달합니다. -->
      <div class="bg-veil absolute inset-0 z-30" aria-hidden="true"></div>
    }
  `,
})
export class NavigationVeil {
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly shown = signal(false);

  /** 베일이 실제로 떠 있는지입니다. 셸이 `aria-busy` 를 붙일 때도 이 값을 읽습니다. */
  readonly visible = this.shown.asReadonly();

  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private shownAt = 0;

  constructor() {
    // 서버에는 전환이 없습니다. 타이머를 걸면 정리되지 않아 빌드가 끝나지 않습니다.
    // 05-rendering.md 2.2절.
    if (!this.isBrowser) return;

    inject(DestroyRef).onDestroy(() => this.clearTimers());

    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (pathOf(event.url) !== pathOf(this.router.url)) this.arm();
        return;
      }

      // 실패에는 최소 유지 시간을 적용하지 않습니다. 실패를 더 기다리게 할 이유가 없습니다.
      if (event instanceof NavigationError) {
        this.clearTimers();
        this.shown.set(false);
        return;
      }

      if (event instanceof NavigationEnd || event instanceof NavigationCancel) this.disarm();
    });
  }

  private arm(): void {
    this.clearTimers();
    this.showTimer = setTimeout(() => {
      // 발화한 핸들을 비웁니다. 남겨 두면 걷는 쪽이 "아직 뜨지 않았다"로 오판해
      // 최소 유지를 걸지 않고 빠져나가며, 베일이 영영 걷히지 않습니다.
      this.showTimer = null;
      this.shownAt = Date.now();
      this.shown.set(true);
    }, WAIT_DELAY);
  }

  private disarm(): void {
    if (this.showTimer) {
      // 아직 뜨지 않았습니다. 빠른 응답은 베일 없이 지나갑니다.
      clearTimeout(this.showTimer);
      this.showTimer = null;
      return;
    }

    if (!this.shown()) return;

    const remaining = Math.max(0, WAIT_MIN - (Date.now() - this.shownAt));
    this.hideTimer = setTimeout(() => this.shown.set(false), remaining);
  }

  private clearTimers(): void {
    if (this.showTimer) clearTimeout(this.showTimer);
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.showTimer = null;
    this.hideTimer = null;
  }
}

/** 쿼리와 프래그먼트를 떼어 경로만 남깁니다. */
function pathOf(url: string): string {
  return url.split('?')[0].split('#')[0];
}
