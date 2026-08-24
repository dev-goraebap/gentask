import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * 아바타 (TK-006). 이미지가 없으면 별명의 첫 글자를 보입니다.
 *
 * 빈 원을 두지 않는 이유는 이미지가 없는 것이 미완성이 아니라 평상시의 모습이기
 * 때문입니다. 크기는 놓는 쪽이 클래스로 정합니다.
 */
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
  readonly name = input.required<string>();

  readonly imageUrl = input<string | null>(null);

  /** 첫 글자입니다. 한글은 대문자가 없어 그대로 나옵니다. */
  protected readonly initial = computed(() => [...this.name()][0]?.toUpperCase() ?? '?');
}
