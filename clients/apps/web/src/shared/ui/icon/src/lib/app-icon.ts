import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { HGI_ICONS, type IconName } from './hugeicons';

/**
 * 아이콘 하나.
 *
 * <p>그림을 이 자리가 갖는다. 화면마다 `provideIcons` 로 등록하면 아이콘을 하나 더 쓸 때마다 그
 * 화면의 클래스를 함께 고쳐야 하고, 이름과 등록이 어긋나면 빈 자리로만 드러난다.
 */
@Component({
  selector: 'app-icon',
  imports: [NgIcon],
  providers: [provideIcons(HGI_ICONS)],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // align-middle 이 없으면 상자 아래가 글줄에 맞춰져 그림이 글자보다 위로 올라간다.
  host: { class: 'inline-flex shrink-0 align-middle' },
  template: `<ng-icon
    [name]="name()"
    [class]="sizeClass()"
    [attr.aria-hidden]="label() ? null : 'true'"
    [attr.aria-label]="label()"
    [attr.role]="label() ? 'img' : null"
  />`,
})
export class AppIcon {
  /** 없는 이름을 넘기면 컴파일이 막는다. 빈 자리로 드러나는 것보다 낫다. */
  readonly name = input.required<IconName>();

  readonly label = input<string | null>(null);

  /**
   * 그림의 크기. 상자는 그대로 두고 그림만 키운다.
   *
   * <p>주지 않으면 감싼 쪽이 정한다 — 단추는 제 크기에 맞춰 안의 그림을 줄이는 규칙을 이미 갖고
   * 있고, 그 규칙은 `text-` 를 가진 그림을 건드리지 않는다. 그래서 여기서 준 것이 이긴다.
   */
  readonly size = input<IconSize | null>(null);

  protected readonly sizeClass = computed(() => {
    const size = this.size();
    return size === null ? null : SIZES[size];
  });
}

export type IconSize = 'md' | 'lg';

const SIZES: Record<IconSize, string> = {
  md: 'text-[length:--spacing(5)]',
  lg: 'text-[length:--spacing(6)]',
};
