import { Directive, ElementRef, computed, inject, signal } from '@angular/core';

const 기본 =
  'block w-full rounded-control border border-line bg-surface text-foreground ' +
  'transition-colors duration-150 ease-standard ' +
  'placeholder:text-subtle ' +
  'hover:border-line-strong ' +
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line ' +
  // 오류 표현을 aria-invalid에 묶는다 — 접근성 속성과 시각 표현이 갈라질 수
  // 없게 된다. Field가 aria-invalid를 붙이면 테두리가 따라온다.
  'aria-invalid:border-danger aria-invalid:hover:border-danger';

const 크기 = 'h-10 px-3.5 text-body';

/**
 * 입력.
 *
 * 스타일만 얹는 디렉티브다(디자인시스템.md §8.3). `<div>`로 컨트롤을 흉내내지
 * 않으므로 폼 연동·유효성·자동완성이 네이티브 그대로 동작한다.
 *
 * 오류 상태를 별도 입력으로 받지 않는다. `aria-invalid`를 보고 스타일이
 * 따라오므로, 접근성 속성을 붙이는 것이 곧 시각 표현이 된다 — 한쪽만 하는
 * 실수가 구조적으로 불가능해진다.
 *
 * `id`·`aria-describedby`는 {@link UiField}가 채운다. 필드 없이 단독으로 써도
 * 동작한다.
 */
@Directive({
  selector: 'input[ui-input], textarea[ui-input], select[ui-input]',
  host: {
    '[class]': 'classes()',
    '[attr.id]': 'fieldId() ?? null',
    '[attr.aria-describedby]': 'describedBy() ?? null',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
  },
})
export class UiInput {
  private readonly 요소 = inject<ElementRef<HTMLElement>>(ElementRef);

  /** 여러 줄 입력은 높이를 고정하지 않는다. 태그를 보고 스스로 판단한다. */
  private readonly 여러줄 = this.요소.nativeElement.tagName === 'TEXTAREA';

  /* 아래 셋은 UiField가 채운다. 단독 사용 시에는 비어 있고, 그러면 호스트
     속성이 붙지 않아 사용자가 직접 준 값이 그대로 남는다. */
  readonly fieldId = signal<string | null>(null);
  readonly describedBy = signal<string | null>(null);
  readonly invalid = signal(false);

  protected readonly classes = computed(
    () => `${기본} ${this.여러줄 ? 'min-h-24 px-3.5 py-2.5 text-body' : 크기}`,
  );
}
