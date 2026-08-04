import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * 표면 컨테이너.
 *
 * <b>깊이는 선이 낸다</b>(Krill, 결정-0024). 같은 평면에서 영역을 가르는 것은
 * 헤어라인 보더이고, 그림자는 <b>실제로 떠 있는 것</b>(모달·팝오버·드롭다운)
 * 에만 쓴다. 정적 카드에 그림자를 얹으면 "떠 있음"이라는 신호가 값싸져서
 * 진짜 떠 있는 것과 구분되지 않는다.
 *
 * 제목을 입력으로 받지 않는다. 카드 안의 제목이 `h2`인지 `h3`인지는 그 카드가
 * 놓인 문서 구조가 결정하므로, 컴포넌트가 정하면 heading 순서가 깨진다.
 */
@Component({
  selector: 'ui-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  host: { '[class]': 'classes()' },
})
export class UiCard {
  /** `elevated`는 떠 있는 표면. 정적 콘텐츠에는 쓰지 않는다. */
  readonly surface = input<'surface' | 'elevated'>('surface');
  readonly padding = input<'none' | 'md' | 'lg'>('md');

  protected readonly classes = computed(() => {
    const 표면 =
      this.surface() === 'elevated'
        ? 'border-border-strong bg-elevated shadow-md'
        : 'border-border bg-elevated hover:border-border-strong';
    const 여백 = { none: '', md: 'p-6', lg: 'p-8' }[this.padding()];
    return `relative flex flex-col gap-4 rounded-lg border transition-colors ${표면} ${여백}`;
  });
}
