import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MORE_SHEET_ITEMS } from '@/shared/config';
import { EXACT_LINK } from '@/shared/lib';
import { HlmButton } from '@/shared/ui/button';
import { AppIcon } from '@/shared/ui/icon';
import { HlmPopoverImports } from '@/shared/ui/popover';
import { BOTTOM_NAV } from './nav-items';

/**
 * 모바일 뷰포트용 하단 탭 바 컴포넌트다.
 */
@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive, HlmButton, HlmPopoverImports, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'bg-toolbar border-border shrink-0 border-t pb-[env(safe-area-inset-bottom)] md:hidden',
    // 스킵 네비게이션을 위해 네비게이션 랜드마크 역할을 부여한다.
    role: 'navigation',
    'aria-label': '자리 이동',
    // 표시할 네비게이션 아이템이 없는 경우 탭 바를 렌더링하지 않는다.
    '[class.hidden]': 'items() === null',
  },
  templateUrl: './bottom-nav.html',
})
export class BottomNav {
  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly exact = EXACT_LINK;

  // --- 의존 --------------------------------------------------------------------------------------
  protected readonly items = inject(BOTTOM_NAV);

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly sheetItems = MORE_SHEET_ITEMS;
}
