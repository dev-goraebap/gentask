import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
  lucideListTodo,
  lucideMenu,
  lucidePanelLeftClose,
  lucidePanelLeftOpen,
  lucideShield,
  lucideUserRound,
} from '@ng-icons/lucide';
import { UserAvatar, UserService } from '@/entities/user';
import { ROUTES } from '@/shared/config';
import { AsideSlotService } from '@/shared/lib';
import { HlmButton } from '@/shared/ui/button';
import { AppIcon } from '@/shared/ui/icon';
import { NavigationVeil } from './navigation-veil';
import { NAV_ICONS, NAV_ITEMS, SHELL_AREA } from './nav-items';
import { SidebarService } from './sidebar-service';
import { ThemeToggle } from './theme-toggle';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgTemplateOutlet,
    AppIcon,
    HlmButton,
    ThemeToggle,
    NavigationVeil,
    UserAvatar,
  ],
  providers: [
    provideIcons({
      ...NAV_ICONS,
      lucideMenu,
      lucidePanelLeftClose,
      lucideListTodo,
      lucidePanelLeftOpen,
      lucideShield,
      lucideUserRound,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex h-dvh overflow-hidden max-md:flex-col' },
  templateUrl: './app-shell.html',
})
export class AppShell {
  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly routes = ROUTES;

  // --- 의존 --------------------------------------------------------------------------------------
  protected readonly navItems = inject(NAV_ITEMS);
  protected readonly area = inject(SHELL_AREA);
  protected readonly asideSlotService = inject(AsideSlotService);
  protected readonly sidebarService = inject(SidebarService);
  protected readonly userService = inject(UserService);

  // --- 질의 --------------------------------------------------------------------------------------
  protected readonly veil = viewChild.required(NavigationVeil);

  // --- 상태 --------------------------------------------------------------------------------------
  protected readonly drawerOpen = signal(false);

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly navClass = computed(() => {
    const width = this.sidebarService.collapsed() ? 'md:w-14' : 'md:w-64';
    const base = `border-border bg-toolbar shrink-0 ${width} md:flex md:flex-col md:overflow-y-auto md:border-r md:p-2 max-md:order-last max-md:border-t max-md:px-2 max-md:pt-1 max-md:pb-[calc(--spacing(1)+env(safe-area-inset-bottom))]`;
    return this.asideSlotService.content() ? `${base} max-md:hidden` : base;
  });

  protected readonly linkClass = computed(() => {
    const base =
      'text-foreground-secondary hover:bg-muted hover:text-foreground flex items-center gap-2.5 rounded-md px-2 py-2 text-sm max-md:min-h-11 max-md:flex-col max-md:justify-center max-md:gap-1 max-md:text-xs';
    return this.sidebarService.collapsed() ? `${base} md:justify-center` : base;
  });

  /** 사이드바 머리의 이름과 그 자리의 첫 화면. */
  protected readonly areaTitle = computed(() => (this.area === 'admin' ? '관리' : '작업'));

  protected readonly areaHome = computed(() =>
    this.area === 'admin' ? ROUTES.adminUsers() : ROUTES.home(),
  );

  /**
   * 다른 자리로 건너가는 단추.
   *
   * <p>관리자가 아니면 없다. 관리 자리에 있는 사람은 이미 관리자이므로 그 판정을 다시 하지 않는다.
   */
  protected readonly crossing = computed(() => {
    if (this.area === 'admin') {
      return { label: '사용자 페이지', icon: 'lucideListTodo', link: ROUTES.tasks() };
    }
    return this.userService.me()?.role === 'ADMIN'
      ? { label: '관리자 페이지', icon: 'lucideShield', link: ROUTES.adminUsers() }
      : null;
  });

  protected readonly columnClass = computed(() =>
    this.asideSlotService.content()
      ? 'flex min-w-0 min-h-0 flex-1 flex-col max-md:hidden'
      : 'flex min-w-0 min-h-0 flex-1 flex-col',
  );
}
