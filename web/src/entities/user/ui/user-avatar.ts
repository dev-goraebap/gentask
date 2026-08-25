import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-user-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'bg-muted text-foreground-secondary inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full',
  },
  template: `
    @if (imageUrl(); as url) {
      <img [src]="url" [alt]="name() + ' 프로필 이미지'" class="size-full object-cover" />
    } @else {
      <span class="font-semibold" aria-hidden="true">{{ initial() }}</span>
    }
  `,
})
export class UserAvatar {
  // --- 계약 --------------------------------------------------------------------------------------
  readonly name = input.required<string>();
  readonly imageUrl = input<string | null>(null);

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly initial = computed(() => [...this.name()][0]?.toUpperCase() ?? '?');
}
