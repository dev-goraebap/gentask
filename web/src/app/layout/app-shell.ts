import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UserAvatar, UserService } from '@/entities/user';
import { ROUTES } from '@/shared/config';
import { AsideSlotService } from '@/shared/lib';
import { HlmButton } from '@/shared/ui/button';
import { AppIcon, type IconName } from '@/shared/ui/icon';
import { NavigationVeil } from './navigation-veil';
import { NAV_ITEMS, SHELL_AREA } from './nav-items';
import { SidebarService } from './sidebar-service';
import { ThemeToggle } from './theme-toggle';

/** 다른 자리로 건너가는 단추 하나. */
interface Crossing {
  readonly label: string;
  readonly icon: IconName;
  readonly link: string;
}

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
      'text-foreground-secondary hover:bg-muted hover:text-foreground flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm';
    return this.sidebarService.collapsed() ? `${base} md:justify-center` : base;
  });

  /** 로고를 누르면 가는 자리. 머리에 서는 이름은 자리와 무관하게 서비스의 것이다. */
  protected readonly areaHome = computed(() =>
    this.area === 'admin' ? ROUTES.adminUsers() : ROUTES.home(),
  );

  /**
   * 다른 자리로 건너가는 단추.
   *
   * <p>관리자가 아니면 없다. 관리 자리에 있는 사람은 이미 관리자이므로 그 판정을 다시 하지 않는다.
   */
  protected readonly crossing = computed<Crossing | null>(() => {
    if (this.area === 'admin') {
      return { label: '사용자 페이지', icon: 'hgiTask', link: ROUTES.tasks() };
    }
    return this.userService.me()?.role === 'ADMIN'
      ? { label: '관리자 페이지', icon: 'hgiShield', link: ROUTES.adminUsers() }
      : null;
  });

  protected readonly columnClass = computed(() =>
    this.asideSlotService.content()
      ? 'flex min-w-0 min-h-0 flex-1 flex-col max-md:hidden'
      : 'flex min-w-0 min-h-0 flex-1 flex-col',
  );
}
