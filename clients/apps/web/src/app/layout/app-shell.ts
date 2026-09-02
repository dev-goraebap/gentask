import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UserAvatar, UserService } from '@/entities/user';
import { ROUTES } from '@/shared/config';
import { AsideSlotService } from '@/shared/lib';
import { HlmButton } from '@/shared/ui/button';
import { AppIcon } from '@/shared/ui/icon';
import { ThemeToggle } from '@/shared/ui/theme-toggle';
import { BottomNav } from './bottom-nav';
import { NAV_GROUPS, SHELL_AREA, SIDEBAR_LEAD } from './nav-items';
import { SidebarService } from './sidebar-service';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgTemplateOutlet,
    NgComponentOutlet,
    AppIcon,
    HlmButton,
    ThemeToggle,
    BottomNav,
    UserAvatar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative flex h-dvh overflow-hidden max-md:flex-col' },
  templateUrl: './app-shell.html',
})
export class AppShell {
  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly routes = ROUTES;

  // --- 의존 --------------------------------------------------------------------------------------
  protected readonly navGroups = inject(NAV_GROUPS);
  protected readonly area = inject(SHELL_AREA);
  protected readonly sidebarLead = inject(SIDEBAR_LEAD);
  protected readonly asideSlotService = inject(AsideSlotService);
  protected readonly sidebarService = inject(SidebarService);
  protected readonly userService = inject(UserService);

  // --- 파생 --------------------------------------------------------------------------------------
  /**
   * 사이드바는 넓은 화면에만 선다.
   *
   * <p>좁은 화면에서는 목록들이 화면 하나를 온전히 쓰는 첫 자리이며, 그것을 띠로 접어 아래에 두면
   * 목록이 늘었을 때 담기지 않는다.
   */
  protected readonly navClass = computed(() => {
    const width = this.sidebarService.collapsed() ? 'md:w-14' : 'md:w-64';
    return `border-border bg-toolbar shrink-0 max-md:hidden ${width} md:flex md:flex-col md:overflow-y-auto md:border-r md:p-2`;
  });

  protected readonly linkClass = computed(() => {
    const base =
      'text-foreground-secondary hover:bg-muted hover:text-foreground flex items-center gap-2.5 rounded-(--radius-nav) px-2 py-2 text-sm';
    return this.sidebarService.collapsed() ? `${base} md:justify-center` : base;
  });

  /** 사이드바의 마크를 누르면 가는 자리. 그 자리의 첫 화면이다. */
  protected readonly areaHome = computed(() => {
    if (this.area === 'admin') return ROUTES.adminUsers();
    if (this.area === 'tracker') return ROUTES.projects();
    return ROUTES.todo();
  });

  protected readonly columnClass = computed(() =>
    this.asideSlotService.content()
      ? 'flex min-w-0 min-h-0 flex-1 flex-col max-md:hidden'
      : 'flex min-w-0 min-h-0 flex-1 flex-col',
  );
}
