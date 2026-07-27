import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
} from '@angular/core';

import { UiSpinner } from '../spinner/spinner';

/**
 * 변형별 표현. 문자열을 리터럴로 두는 이유는 Tailwind가 소스를 훑어
 * 유틸리티를 생성하기 때문이다 — 조립해서 만들면 클래스가 생성되지 않는다.
 */
const 변형 = {
  /** 화면에서 가장 중요한 동작 하나. 한 화면에 둘 이상 두지 않는다. */
  primary:
    'bg-accent text-on-accent border-transparent hover:bg-accent-hover active:bg-accent-pressed',
  /** 기본값. 대부분의 동작이 여기 해당한다. */
  secondary: 'bg-surface text-foreground border-line hover:bg-elevated hover:border-line-strong',
  /** 테두리 없는 동작. 목록 안의 부가 동작이나 취소에 쓴다. */
  quiet: 'bg-transparent text-muted border-transparent hover:bg-accent-soft hover:text-foreground',
  /** 되돌릴 수 없는 동작. 확인 단계와 함께 쓴다. */
  danger: 'bg-danger-fill text-on-danger border-transparent hover:bg-danger-fill-hover',
} as const;

const 크기 = {
  sm: 'h-8 gap-1.5 px-3 text-body-sm',
  md: 'h-10 gap-2 px-4 text-body',
  lg: 'h-12 gap-2 px-5 text-body',
} as const;

const 아이콘크기 = {
  sm: 'size-8 p-0',
  md: 'size-10 p-0',
  lg: 'size-12 p-0',
} as const;

const 기본 =
  'inline-flex select-none items-center justify-center whitespace-nowrap rounded-control border ' +
  'font-medium transition-colors duration-150 ease-standard active:translate-y-px ' +
  'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50';

/**
 * 버튼.
 *
 * `<button>`과 `<a>` 위에 속성 선택자로 얹는다(디자인시스템.md §8.3). 래퍼
 * 요소를 만들지 않으므로 네이티브 의미와 폼 연동이 그대로 살아 있고, flex
 * 레이아웃 안에서도 예상대로 동작한다.
 *
 * `disabled`를 자체 입력으로 갖는 이유: `<a>`는 네이티브 `disabled`가 없어서
 * 두 요소를 같은 API로 다루려면 우리가 중개해야 한다. `<button>`에는 실제
 * 속성으로, `<a>`에는 `aria-disabled` + `tabindex="-1"`로 내려간다.
 *
 * `loading`은 비활성과 같이 동작하되 스피너를 띄우고 `aria-busy`를 붙인다.
 * 텍스트를 스피너로 갈아치우지 않는 이유는 버튼 폭이 변해 레이아웃이 흔들리기
 * 때문이다 — 스피너를 앞에 덧붙인다.
 */
@Component({
  selector: 'button[ui-button], a[ui-button]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiSpinner],
  template: `
    @if (loading()) {
      <ui-spinner size="sm" />
    }
    <ng-content />
  `,
  host: {
    '[class]': 'classes()',
    '[attr.disabled]': 'nativeDisabled()',
    '[attr.aria-disabled]': 'ariaDisabled()',
    '[attr.tabindex]': 'anchorTabIndex()',
    '[attr.aria-busy]': 'loading() ? "true" : null',
  },
})
export class UiButton {
  private readonly 요소 = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly variant = input<keyof typeof 변형>('secondary');
  readonly size = input<keyof typeof 크기>('md');

  /** 아이콘만 담는 정사각형 버튼. 이때 접근가능한 이름을 반드시 따로 준다. */
  readonly iconOnly = input(false);

  readonly disabled = input(false);
  readonly loading = input(false);

  private readonly 앵커 = this.요소.nativeElement.tagName === 'A';
  private readonly 잠김 = computed(() => this.disabled() || this.loading());

  protected readonly classes = computed(
    () =>
      `${기본} ${변형[this.variant()]} ` +
      `${this.iconOnly() ? 아이콘크기[this.size()] : 크기[this.size()]}` +
      `${this.loading() ? ' cursor-wait' : ''}`,
  );

  /** `<button>`에만 실제 속성을 붙인다. `<a disabled>`는 아무 의미가 없다. */
  protected readonly nativeDisabled = computed(() => (!this.앵커 && this.잠김() ? '' : null));

  protected readonly ariaDisabled = computed(() => (this.앵커 && this.잠김() ? 'true' : null));

  protected readonly anchorTabIndex = computed(() => (this.앵커 && this.잠김() ? '-1' : null));
}
