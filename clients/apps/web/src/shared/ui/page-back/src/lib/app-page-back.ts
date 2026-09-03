import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@/shared/ui/button';
import { AppIcon } from '@/shared/ui/icon';

/**
 * 모바일 뷰포트에서 상위 단계로 돌아가는 뒤로가기 링크 버튼 컴포넌트다.
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
  /** 상위 페이지의 라우터 경로다. */
  readonly to = input.required<string>();

  readonly label = input('앞 단계로 돌아가기');
}
