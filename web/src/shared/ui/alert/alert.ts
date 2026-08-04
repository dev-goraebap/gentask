import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * 배경은 `-soft`, 텍스트·iconPath은 기본형을 쓴다(디자인시스템.md §2.3).
 * 서로 바꿔 쓰면 대비가 무너진다.
 */
const 의도 = {
  info: { box: 'bg-info-soft text-info', icon: 'M12 16v-5M12 8h.01' },
  success: { box: 'bg-success-soft text-success', icon: 'M8 12.5l2.5 2.5L16 9.5' },
  warning: { box: 'bg-warning-soft text-warning', icon: 'M12 8v5M12 16h.01' },
  danger: { box: 'bg-danger-soft text-danger', icon: 'M15 9l-6 6M9 9l6 6' },
} as const;

/**
 * 상태 배너.
 *
 * `danger`·`warning`은 `role="alert"`로 즉시 읽히고, `info`·`success`는
 * `role="status"`로 진행 중인 작업을 끊지 않고 읽힌다. 모든 배너를 alert로
 * 두면 스크린리더 사용자의 작업이 계속 끊긴다.
 *
 * iconPath은 장식이다(`aria-hidden`) — 의미는 본문이 전달한다. 색만으로 의도를
 * 구분하지 않기 위해 iconPath 모양도 의도마다 다르다.
 */
@Component({
  selector: 'ui-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      class="mt-0.5 size-5 shrink-0"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke-opacity="0.35" />
      <path [attr.d]="iconPath()" />
    </svg>

    <div class="flex min-w-0 flex-col gap-0.5">
      @if (title()) {
        <p class="text-[0.9375rem] font-semibold text-fg">{{ title() }}</p>
      }
      <div class="text-[0.875rem] text-fg-muted">
        <ng-content />
      </div>
    </div>
  `,
  host: {
    '[class]': 'classes()',
    '[attr.role]': 'role()',
  },
})
export class UiAlert {
  readonly intent = input<keyof typeof 의도>('info');
  readonly title = input<string>();

  // 보더를 두지 않는다 — soft 배경이 이미 면을 구분하므로 선을 더하면 이중이다.
  protected readonly classes = computed(
    () => `flex gap-3 rounded-lg p-4 ${의도[this.intent()].box}`,
  );

  protected readonly iconPath = computed(() => 의도[this.intent()].icon);

  /** 사용자를 멈춰야 하는 것만 alert로 알린다. */
  protected readonly role = computed(() =>
    this.intent() === 'danger' || this.intent() === 'warning' ? 'alert' : 'status',
  );
}
