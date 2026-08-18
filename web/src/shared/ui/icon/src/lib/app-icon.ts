import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

/**
 * 아이콘 래퍼입니다. SVG 를 템플릿에 직접 붙여 넣는 것을 금지하며 이 컴포넌트만 씁니다.
 *
 * 래퍼를 두는 이유는 크기와 색상 토큰 적용을 한 곳에서 보장하고, 아이콘 세트를 교체할 때
 * 사용처를 수정하지 않기 위함입니다. 근거는 docs/architecture/references/04-design-system.md 6절입니다.
 *
 * 색은 currentColor 로 상속받으므로 사용처가 텍스트 색 토큰을 정하면 아이콘이 따라옵니다.
 * 여기서 색을 지정하면 사용처마다 덮어쓰게 되어 래퍼를 둔 이유가 사라집니다.
 */
@Component({
  selector: 'app-icon',
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex shrink-0' },
  template: `<ng-icon [name]="name()" [attr.aria-hidden]="label() ? null : 'true'"
    [attr.aria-label]="label()" [attr.role]="label() ? 'img' : null" />`,
})
export class AppIcon {
  readonly name = input.required<string>();

  /**
   * 아이콘이 의미를 갖는 경우에만 지정합니다. 비어 있으면 접근성 트리에서 숨깁니다.
   * 아이콘만 있는 버튼의 이름은 버튼이 aria-label 로 갖고 아이콘은 장식으로 둡니다.
   * 13-accessibility.md 3절.
   */
  readonly label = input<string | null>(null);
}
