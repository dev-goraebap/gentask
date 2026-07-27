import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const 크기 = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-8',
} as const;

/**
 * 로딩 표시.
 *
 * `label`이 있으면 스크린리더에 상태로 읽히고(`role="status"`), 없으면 장식으로
 * 숨긴다. 버튼 안에 들어갈 때는 버튼이 `aria-busy`를 이미 알리므로 label을
 * 주지 않는다 — 둘 다 읽으면 중복된다.
 *
 * 회전은 전역 `prefers-reduced-motion` 규칙이 걷어낸다.
 */
@Component({
  selector: 'ui-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 24 24" fill="none" class="size-full animate-spin" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
      />
    </svg>
  `,
  host: {
    '[class]': 'classes()',
    '[attr.role]': 'label() ? "status" : null',
    '[attr.aria-label]': 'label() ?? null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
})
export class UiSpinner {
  readonly size = input<keyof typeof 크기>('md');

  /** 지정하면 스크린리더가 읽는다. 버튼 내부에서는 비워 둔다. */
  readonly label = input<string>();

  protected readonly classes = computed(() => `inline-block shrink-0 ${크기[this.size()]}`);
}
