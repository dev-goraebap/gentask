import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@/shared/ui/button';
import { AppIcon } from '@/shared/ui/icon';

/**
 * 앞 단계로 가는 길.
 *
 * <p>좁은 화면에만 선다. 넓은 화면에서는 사이드바가 갈 수 있는 자리를 이미 다 보여 주므로 한 단계씩
 * 되짚을 이유가 없다.
 *
 * <p>제목 왼쪽에 붙는다. 껍데기의 머리에 두면 좁은 화면에서 같은 성격의 띠가 둘이 되고, 제목이
 * 그 아래에 한 번 더 선다.
 *
 * <p>왼쪽으로 당기는 것은 단추가 그림 둘레에 여백을 갖기 때문이다. 여백을 그대로 두면 제목만 글의
 * 왼끝에 맞고 그림은 안쪽으로 들어가 두 줄의 시작이 어긋난다. 제목과의 사이도 같은 이유로 띄우지
 * 않는다 — 단추가 가진 여백이 이미 그 자리를 갖는다.
 */
@Component({
  selector: 'app-page-back',
  imports: [RouterLink, HlmButton, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: '-ml-2 md:hidden' },
  template: `
    <a
      hlmBtn
      variant="ghost"
      size="icon-sm"
      class="rounded-(--radius-nav)"
      [routerLink]="to()"
      [attr.aria-label]="label()"
    >
      <app-icon name="hgiArrowLeft" size="lg" />
    </a>
  `,
})
export class AppPageBack {
  // --- 계약 --------------------------------------------------------------------------------------
  /** 앞 단계의 주소. 자리마다 다르므로 이 자리가 정하지 않는다. */
  readonly to = input.required<string>();

  readonly label = input('앞 단계로 돌아가기');
}
