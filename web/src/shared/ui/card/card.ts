import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * 표면 컨테이너.
 *
 * 정적 카드에는 그림자를 얹지 않는다(디자인시스템.md §5) — 반경과 헤어라인으로
 * 충분하다. `elevated`는 모달·팝오버처럼 실제로 떠 있는 것에만 쓴다.
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
    const 표면 = this.surface() === 'elevated' ? 'bg-elevated shadow-floating' : 'bg-surface';
    const 여백 = { none: '', md: 'p-5', lg: 'p-7' }[this.padding()];
    return `flex flex-col gap-4 rounded-surface border border-line ${표면} ${여백}`;
  });
}
