import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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
    [attr.aria-hidden]="label() ? null : 'true'"
    [attr.aria-label]="label()"
    [attr.role]="label() ? 'img' : null"
  />`,
})
export class AppIcon {
  /** 없는 이름을 넘기면 컴파일이 막는다. 빈 자리로 드러나는 것보다 낫다. */
  readonly name = input.required<IconName>();

  readonly label = input<string | null>(null);
}
