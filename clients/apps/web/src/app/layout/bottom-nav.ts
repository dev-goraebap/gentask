import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '@/entities/user';
import { MORE_SHEET_ITEMS, ROUTES } from '@/shared/config';
import { HlmButton } from '@/shared/ui/button';
import { AppIcon } from '@/shared/ui/icon';
import { HlmPopoverImports } from '@/shared/ui/popover';
import { BOTTOM_NAV } from './nav-items';

/**
 * 좁은 화면 바닥의 띠.
 *
 * <p>넓은 화면에는 사이드바가 같은 것을 이미 보여 주므로 서지 않는다.
 *
 * <p>담기는 것은 자리마다 다르고 라우트가 내려 준다. 마지막 칸인 더보기만 어느 자리에서나 같으므로
 * 이 자리가 붙인다.
 *
 * <p>더보기는 팝오버로 연다. 좁은 화면에서 팝오버가 아래에서 올라오는 시트가 되므로 따로 만들 것이
 * 없고, 새로 만들면 여닫는 규약이 둘이 된다.
 */
@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive, HlmButton, HlmPopoverImports, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'bg-toolbar border-border shrink-0 border-t pb-[env(safe-area-inset-bottom)] md:hidden',
  },
  templateUrl: './bottom-nav.html',
})
export class BottomNav {
  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly routes = ROUTES;
  protected readonly sheetItems = computed(() => MORE_SHEET_ITEMS);

  // --- 의존 --------------------------------------------------------------------------------------
  protected readonly items = inject(BOTTOM_NAV);
  private readonly userService = inject(UserService);

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly admin = computed(() => this.userService.me()?.role === 'ADMIN');
}
