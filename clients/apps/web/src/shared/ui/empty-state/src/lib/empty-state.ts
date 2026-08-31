import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** 얹을 삽화. 마스크로 그리며 색은 이 컴포넌트가 쓰는 자리의 글자색을 따른다. */
export type EmptyIllustration = 'empty' | 'error-404' | 'error-500';

/**
 * 보여 줄 것이 없는 자리.
 *
 * <p><b>불러오는 중은 이 자리가 아니다.</b> 조회가 끝나고 결과가 비었을 때만 그린다. 기다리는 동안
 * 그리면 곧 채워질 자리를 두고 없다고 알리게 되고, 데이터가 도착하는 순간 화면이 두 번 바뀐다.
 * 대기는 베일이 덮는다.
 */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col items-center justify-center gap-5 px-6 py-12 text-center' },
  template: `
    <div aria-hidden="true" [class]="illustrationClass()"></div>

    <div class="flex flex-col gap-1">
      <p class="text-foreground text-sm font-medium">{{ title() }}</p>
      @if (description(); as text) {
        <p class="text-foreground-secondary max-w-sm text-sm">{{ text }}</p>
      }
    </div>

    <ng-content />
  `,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly illustration = input<EmptyIllustration>('empty');

  /** 삽화의 크기. 목록 안에서는 작게, 화면 하나를 채우는 자리에서는 크게 쓴다. */
  readonly size = input<'sm' | 'lg'>('sm');

  protected readonly illustrationClass = computed(() => {
    const 높이 = this.size() === 'lg' ? 'h-48 max-w-md' : 'h-32 max-w-56';
    return [
      'illustration text-foreground-secondary/70 w-full shrink-0',
      높이,
      ILLUSTRATION_CLASS[this.illustration()],
    ].join(' ');
  });
}

const ILLUSTRATION_CLASS: Record<EmptyIllustration, string> = {
  empty: 'illustration-empty',
  'error-404': 'illustration-404',
  'error-500': 'illustration-500',
};
