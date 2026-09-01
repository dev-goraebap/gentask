import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { UserAvatar, UserService } from '@/entities/user';
import { ROUTES } from '@/shared/config';
import { AsideSlotService } from '@/shared/lib';
import { HlmButton } from '@/shared/ui/button';
import { AppIcon, type IconName } from '@/shared/ui/icon';
import { NavigationVeil } from './navigation-veil';
import { NAV_GROUPS, SHELL_AREA, SIDEBAR_LEAD } from './nav-items';
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
    NgComponentOutlet,
    AppIcon,
    HlmButton,
    ThemeToggle,
    NavigationVeil,
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
  private readonly router = inject(Router);

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
      'text-foreground-secondary hover:bg-muted hover:text-foreground flex items-center gap-2.5 rounded-(--radius-nav) px-2 py-2 text-sm';
    return this.sidebarService.collapsed() ? `${base} md:justify-center` : base;
  });

  /**
   * 지금 자리가 그 축의 첫 단계인가.
   *
   * <p>좁은 화면에서 앞 단계로 돌아가는 길을 보일지 가른다. 첫 단계에는 돌아갈 앞이 없으므로 그
   * 자리에 서비스의 이름을 둔다.
   */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly atRoot = computed(() => {
    const path = this.url().split('?')[0].replace(/\/$/, '');
    return (
      path === '' ||
      path === '/tasks' ||
      path === '/admin' ||
      path === ROUTES.issues() ||
      path === ROUTES.docs() ||
      path === ROUTES.projectSettings()
    );
  });

  /**
   * 좁은 화면에서 앞 단계로 가는 자리.
   *
   * <p>트래커에는 목록들에 해당하는 자리가 없다. 상세에서 나오면 그것을 담고 있던 목록으로 간다.
   */
  protected readonly areaBack = computed(() => {
    if (this.area !== 'tracker') return ROUTES.tasks();
    return this.url().startsWith(ROUTES.docs()) ? ROUTES.docs() : ROUTES.issues();
  });

  /** 로고를 누르면 가는 자리. 머리에 서는 이름은 자리와 무관하게 서비스의 것이다. */
  protected readonly areaHome = computed(() => {
    if (this.area === 'admin') return ROUTES.adminUsers();
    if (this.area === 'tracker') return ROUTES.issues();
    return ROUTES.home();
  });

  /**
   * 다른 자리로 건너가는 단추.
   *
   * <p>이름은 동작이 아니라 건너갈 자리로 적는다. 관리 자리에 있는 사람은 이미 관리자이므로 그
   * 판정을 다시 하지 않는다.
   */
  protected readonly crossing = computed<Crossing | null>(() => {
    if (this.area === 'admin') {
      return { label: '사용자 페이지', icon: 'hgiTask', link: ROUTES.tasks() };
    }
    if (this.area === 'tracker') {
      return { label: '할 일', icon: 'hgiTask', link: ROUTES.tasks() };
    }
    return { label: '트래커', icon: 'hgiLayers', link: ROUTES.issues() };
  });

  /** 관리 자리로 건너가는 단추. 관리자에게만 선다. */
  protected readonly adminCrossing = computed<Crossing | null>(() =>
    this.area !== 'admin' && this.userService.me()?.role === 'ADMIN'
      ? { label: '관리자 페이지', icon: 'hgiShield', link: ROUTES.adminUsers() }
      : null,
  );

  protected readonly columnClass = computed(() =>
    this.asideSlotService.content()
      ? 'flex min-w-0 min-h-0 flex-1 flex-col max-md:hidden'
      : 'flex min-w-0 min-h-0 flex-1 flex-col',
  );
}
