import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model,
  output,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';

/**
 * OTP 입력 — 이메일 소유 증명 코드를 받는다(결정-0015).
 *
 * **칸을 여러 개 두지 않고 실제 입력은 하나다.** 자리마다 `<input>`을 두는
 * 흔한 구현은 접근성이 나쁘다 — 스크린리더가 "1번째 자리 편집" 여섯 번을
 * 읽고, 붙여넣기·자동완성·모바일 키보드가 자리마다 따로 동작한다.
 * 여기서는 투명한 입력 하나가 전체를 덮고 칸은 그림만 그린다. 그래서
 *
 * - 붙여넣기가 네이티브로 동작한다(여섯 자리를 나눠 넣는 코드가 필요 없다)
 * - `autocomplete="one-time-code"`로 OS 자동완성이 붙는다
 * - 스크린리더에는 입력 하나로 읽힌다
 * - 커서 이동·전체 선택·삭제가 브라우저 기본 동작을 그대로 쓴다
 *
 * 숫자만 남기고 길이를 잘라내는 것 외에는 키 입력을 가로채지 않는다.
 */
@Component({
  selector: 'ui-otp-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="relative w-fit">
      <!-- 그림. 포인터 이벤트를 받지 않아 클릭이 아래 입력으로 통과한다. -->
      <div class="pointer-events-none flex gap-2" aria-hidden="true">
        @for (slot of slots(); track $index) {
          <div
            class="flex h-12 w-10 items-center justify-center rounded-control border bg-surface text-headline-md font-medium text-foreground transition-colors duration-150 ease-standard"
            [class]="cellClass(slot.active)"
          >
            @if (slot.char) {
              {{ slot.char }}
            } @else if (slot.active && focused()) {
              <span class="h-5 w-px animate-pulse bg-accent-ink"></span>
            }
          </div>
        }
      </div>

      <!-- 실제 입력. 투명하게 위를 덮는다. -->
      <input
        #control
        type="text"
        inputmode="numeric"
        autocomplete="one-time-code"
        [attr.maxlength]="length()"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        [value]="value()"
        (input)="onInput($event)"
        (focus)="focused.set(true)"
        (blur)="focused.set(false)"
        class="absolute inset-0 w-full bg-transparent text-center tracking-[2.1rem] text-transparent caret-transparent outline-none focus-visible:shadow-none"
      />
    </div>
  `,
})
export class UiOtpInput {
  private readonly 입력요소 = viewChild.required<ElementRef<HTMLInputElement>>('control');

  readonly length = input(6);
  readonly ariaLabel = input('인증 코드');
  readonly invalid = input(false);

  /** 양방향. 숫자만, 길이 초과분은 잘린다. */
  readonly value = model('');

  /** 길이가 다 찼을 때 한 번 발생한다. 제출을 자동으로 이어붙일 때 쓴다. */
  readonly completed = output<string>();

  protected readonly focused = signal(false);

  protected readonly slots = computed(() => {
    const 값 = this.value();
    const activeIndex = Math.min(값.length, this.length() - 1);
    return Array.from({ length: this.length() }, (_, i) => ({
      char: 값[i] ?? '',
      active: i === activeIndex,
    }));
  });

  constructor() {
    // 값이 외부에서 채워진 경우(자동완성·복원)에도 완료를 알린다.
    let 마지막알림 = '';
    effect(() => {
      const 값 = this.value();
      if (값.length === this.length() && 값 !== 마지막알림) {
        마지막알림 = 값;
        this.completed.emit(값);
      } else if (값.length < this.length()) {
        마지막알림 = '';
      }
    });
  }

  /**
   * 칸 하나의 상태 표현.
   *
   * 포커스 링을 스트립 전체가 아니라 **활성 칸에만** 그린다. 투명한 입력이
   * 전체를 덮고 있어 전역 `:focus-visible` 링을 그대로 두면 스트립을 통째로
   * 감싸버린다(그래서 입력 쪽은 `focus-visible:shadow-none`으로 끈다).
   * 칸에 그리는 편이 "지금 어디를 입력하는가"도 함께 알려준다.
   *
   * 오류는 칸 테두리로 나타낸다 — `aria-invalid`는 보이지 않는 입력에 붙으므로
   * 그것만으로는 시각적 표현이 없다.
   */
  protected cellClass(active: boolean): string {
    const 테두리 = this.invalid() ? 'border-danger' : active ? 'border-accent' : 'border-line';

    // 오류 상태에서도 링 색은 그대로 둔다 — 포커스 표시가 상태에 따라 색을
    // 바꾸면 "지금 포커스가 여기 있다"는 신호를 알아보기 어려워진다.
    // 오류는 테두리가 말한다.
    const 링 = active && this.focused() ? ' [box-shadow:var(--focus-ring)]' : '';

    return 테두리 + 링;
  }

  focus(): void {
    this.입력요소().nativeElement.focus();
  }

  protected onInput(이벤트: Event): void {
    const 요소 = 이벤트.target as HTMLInputElement;
    const 정제됨 = 요소.value.replace(/\D/g, '').slice(0, this.length());

    // 정제 결과가 다르면 DOM을 되돌린다 — 그러지 않으면 걸러진 문자가
    // 화면의 입력 요소에는 남아 커서 위치가 어긋난다.
    if (요소.value !== 정제됨) {
      요소.value = 정제됨;
    }

    this.value.set(정제됨);
  }
}
