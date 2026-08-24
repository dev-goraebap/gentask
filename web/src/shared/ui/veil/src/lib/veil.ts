import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  PLATFORM_ID,
  signal,
} from '@angular/core';

/** 이 시간 안에 끝나면 베일을 띄우지 않습니다. 10-loading.md 4절. */
const WAIT_DELAY = 200;

/** 한 번 띄운 베일은 최소 이 시간 유지합니다. 즉시 사라지면 깜빡임이 됩니다. */
const WAIT_MIN = 400;

/**
 * 대기 중인 콘텐츠 영역을 덮습니다.
 *
 * 대기하는 동안 이전 모습을 유지해 맥락을 지키는 장치입니다. 반쯤 채워진 화면과
 * 순차적 레이아웃 이동을 허용하지 않는다는 원칙의 구현이며, 스켈레톤을 대신합니다.
 * 근거는 docs/architecture/references/10-loading.md 1절입니다.
 *
 * 무엇이 대기인지는 놓는 쪽이 `loading` 입력으로 정합니다. 화면 전환이면 라우터 이벤트가,
 * 데이터 조회면 `httpResource` 의 상태가 그 값을 만듭니다. 시간 정책은 이 컴포넌트가
 * 소유합니다. 화면마다 다른 값을 쓰면 같은 대기가 화면에 따라 다르게 보입니다(7.1절).
 *
 * 실패는 `failed` 로 받습니다. 실패에는 최소 유지 시간을 적용하지 않고 즉시 걷습니다.
 * 실패를 더 기다리게 할 이유가 없습니다(4절).
 *
 * 화면 전체가 아니라 콘텐츠 영역만 덮습니다. 대기 중에도 다른 화면으로 이동할 수 있어야
 * 하므로 상단 바는 덮지 않으며, 그래서 `position: fixed` 가 아니라 놓는 쪽이 지정한
 * 기준 상자 안에서 `absolute` 로 펼칩니다.
 */
@Component({
  selector: 'app-veil',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <!-- 가림막 자체는 읽을 것이 없습니다. 대기 사실은 놓는 쪽의 aria-busy 가 전달합니다. -->
      <div class="bg-veil absolute inset-0 z-30" aria-hidden="true"></div>
    }
  `,
})
export class Veil {
  readonly loading = input.required<boolean>();

  readonly failed = input(false);

  private readonly shown = signal(false);

  /** 베일이 실제로 떠 있는지입니다. 놓는 쪽이 `aria-busy` 를 붙일 때 이 값을 읽습니다. */
  readonly visible = this.shown.asReadonly();

  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private shownAt = 0;

  constructor() {
    // 서버에는 대기 표현이 없습니다. 타이머를 걸면 정리되지 않아 빌드가 끝나지 않습니다.
    // 05-rendering.md 2.2절.
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

    inject(DestroyRef).onDestroy(() => this.clearTimers());

    effect(() => {
      if (this.failed()) {
        this.clearTimers();
        this.shown.set(false);
        return;
      }

      if (this.loading()) this.arm();
      else this.disarm();
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
