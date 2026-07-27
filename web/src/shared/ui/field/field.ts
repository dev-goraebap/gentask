import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  input,
} from '@angular/core';

import { UiInput } from '../input/input';

let 일련번호 = 0;

/**
 * 폼 필드 — 라벨 · 힌트 · 오류를 컨트롤에 묶는다.
 *
 * 접근성 배선을 호출부에서 걷어내는 것이 이 컴포넌트의 존재 이유다. 아래
 * 셋은 손으로 하면 반드시 빠뜨린다.
 * - `label[for]` ↔ 컨트롤 `id`
 * - `aria-describedby` → 힌트 또는 오류 문장
 * - `aria-invalid` → 오류가 있을 때
 *
 * 투영된 컨트롤을 콘텐츠 쿼리로 찾아 값을 밀어 넣는다. DI로 부모를 찾는
 * 방법은 쓸 수 없다 — 투영된 콘텐츠의 인젝터는 선언 위치(호출부)이지
 * 삽입 위치(이 컴포넌트 안)가 아니다.
 *
 * 힌트와 오류는 동시에 보이지 않는다. 오류가 있으면 오류만 읽힌다 —
 * 둘을 함께 읽으면 스크린리더 사용자가 무엇을 고쳐야 하는지 흐려진다.
 */
@Component({
  selector: 'ui-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-1.5' },
  template: `
    @if (label()) {
      <label [attr.for]="controlId" class="text-label tracking-normal text-muted">
        {{ label() }}
        @if (required()) {
          <span class="text-danger" aria-hidden="true">*</span>
        }
      </label>
    }

    <ng-content />

    @if (error()) {
      <p [id]="errorId" class="text-body-sm text-danger">{{ error() }}</p>
    } @else if (hint()) {
      <p [id]="hintId" class="text-body-sm text-subtle">{{ hint() }}</p>
    }
  `,
})
export class UiField {
  private readonly 컨트롤 = contentChild(UiInput);

  readonly label = input<string>();
  readonly hint = input<string>();
  readonly error = input<string>();
  readonly required = input(false);

  protected readonly controlId = `ui-field-${++일련번호}`;
  protected readonly hintId = `${this.controlId}-hint`;
  protected readonly errorId = `${this.controlId}-error`;

  private readonly 설명대상 = computed(() => {
    if (this.error()) return this.errorId;
    if (this.hint()) return this.hintId;
    return null;
  });

  constructor() {
    effect(() => {
      const 컨트롤 = this.컨트롤();
      if (!컨트롤) return;

      컨트롤.fieldId.set(this.controlId);
      컨트롤.describedBy.set(this.설명대상());
      컨트롤.invalid.set(!!this.error());
    });
  }
}
