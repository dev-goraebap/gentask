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
  lucideCalendarRange,
  lucideHouse,
  lucideMenu,
  lucidePanelLeftClose,
  lucidePanelLeftOpen,
  lucideStar,
  lucideSun,
  lucideUserRound,
} from '@ng-icons/lucide';
import { TASK_VIEWS, type TaskView } from '@/entities/task';
import { CurrentUser, UserAvatar } from '@/entities/user';
import { ROUTES } from '@/shared/config';
import { AsideSlot } from '@/shared/lib';
import { HlmButton } from '@/shared/ui/button';
import { AppIcon } from '@/shared/ui/icon';
import { SidebarStore } from '../sidebar';
import { NavigationVeil } from './navigation-veil';
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
      lucideCalendarRange,
      lucideHouse,
      lucideMenu,
      lucidePanelLeftClose,
      lucidePanelLeftOpen,
      lucideStar,
      lucideSun,
      lucideUserRound,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex h-dvh overflow-hidden max-md:flex-col' },
  template: `
    <nav id="sidebar" [class]="navClass()" aria-label="탐색">
      @if (!sidebar.collapsed()) {
        <a
          [routerLink]="routes.home()"
          class="mb-1 hidden px-2 py-1 text-base font-semibold tracking-tight md:block"
        >
          작업
        </a>
      }

      <ul class="hidden gap-1 md:flex md:flex-col">
        @for (item of views; track item.value) {
          <li>
            <a
              [routerLink]="routes.taskList(item.value)"
              routerLinkActive="bg-muted text-foreground"
              #active="routerLinkActive"
              [attr.aria-current]="active.isActive ? 'page' : null"
              [attr.aria-label]="sidebar.collapsed() ? item.label : null"
              [attr.title]="sidebar.collapsed() ? item.label : null"
              [class]="linkClass()"
            >
              <app-icon [name]="icons[item.value]" />
              <span [class]="sidebar.collapsed() ? 'md:hidden' : ''">{{ item.label }}</span>
            </a>
          </li>
        }
      </ul>

      @if (currentUser.me(); as me) {
        <a
          [routerLink]="routes.account()"
          routerLinkActive="bg-muted text-foreground"
          class="text-foreground-secondary hover:bg-muted hover:text-foreground mt-auto hidden items-center gap-2.5 rounded-md px-2 py-2 md:flex"
          [class.md:justify-center]="sidebar.collapsed()"
          [attr.aria-label]="sidebar.collapsed() ? '계정' : null"
          [attr.title]="sidebar.collapsed() ? '계정' : null"
        >
          <app-user-avatar
            class="size-7 text-xs"
            [name]="me.nickname"
            [imageUrl]="me.profileImageUrl"
          />
          @if (!sidebar.collapsed()) {
            <span class="min-w-0 flex-1 truncate text-sm">{{ me.nickname }}</span>
          }
        </a>
      }

      <ul class="flex justify-around gap-1 md:hidden">
        <li class="flex-1">
          <a
            [routerLink]="routes.tasks()"
            routerLinkActive="bg-muted text-foreground"
            #tasksActive="routerLinkActive"
            [attr.aria-current]="tasksActive.isActive ? 'page' : null"
            [class]="linkClass()"
          >
            <app-icon name="lucideHouse" />
            <span>할일</span>
          </a>
        </li>
        <li class="flex-1">
          <a
            [routerLink]="routes.account()"
            routerLinkActive="bg-muted text-foreground"
            #accountActive="routerLinkActive"
            [attr.aria-current]="accountActive.isActive ? 'page' : null"
            [class]="linkClass()"
          >
            <app-icon name="lucideUserRound" />
            <span>계정</span>
          </a>
        </li>
      </ul>
    </nav>

    <div [class]="columnClass()">
      <a
        href="#main"
        class="sr-only focus:not-sr-only focus:bg-primary focus:text-primary-foreground focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2"
      >
        본문으로 건너뛰기
      </a>

      <header class="bg-toolbar border-border flex h-14 shrink-0 items-center gap-4 border-b px-4">
        <button
          hlmBtn
          variant="ghost"
          size="icon-sm"
          type="button"
          class="max-md:hidden"
          aria-controls="sidebar"
          [attr.aria-expanded]="!sidebar.collapsed()"
          [attr.aria-label]="sidebar.collapsed() ? '사이드바 펼치기' : '사이드바 접기'"
          (click)="sidebar.toggle()"
        >
          <app-icon [name]="sidebar.collapsed() ? 'lucidePanelLeftOpen' : 'lucidePanelLeftClose'" />
        </button>
        <button
          hlmBtn
          variant="ghost"
          size="icon-sm"
          type="button"
          class="md:hidden"
          aria-controls="mobile-drawer"
          [attr.aria-expanded]="drawerOpen()"
          aria-label="스마트 목록 열기"
          (click)="drawerOpen.set(true)"
        >
          <app-icon name="lucideMenu" />
        </button>
        <a [routerLink]="routes.home()" class="text-base font-semibold tracking-tight md:hidden">
          작업
        </a>
        <span class="flex-1"></span>
        <app-theme-toggle />
      </header>

      <main
        id="main"
        class="relative flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-gutter:stable]"
        [attr.aria-busy]="veil().visible() || null"
      >
        <app-navigation-veil />
        <router-outlet />
      </main>
    </div>

    @if (drawerOpen()) {
      <div class="fixed inset-0 z-40 md:hidden">
        <div
          class="bg-veil absolute inset-0"
          aria-hidden="true"
          (click)="drawerOpen.set(false)"
        ></div>
        <nav
          id="mobile-drawer"
          class="bg-background border-border absolute inset-y-0 left-0 flex w-64 flex-col border-r p-2"
          aria-label="스마트 목록"
        >
          <p class="px-2 py-1 text-base font-semibold tracking-tight">작업</p>
          <ul class="mt-1 flex flex-col gap-1">
            @for (item of views; track item.value) {
              <li>
                <a
                  [routerLink]="routes.taskList(item.value)"
                  routerLinkActive="bg-muted text-foreground"
                  #drawerActive="routerLinkActive"
                  [attr.aria-current]="drawerActive.isActive ? 'page' : null"
                  class="text-foreground-secondary hover:bg-muted hover:text-foreground flex items-center gap-2.5 rounded-md px-2 py-2 text-sm"
                  (click)="drawerOpen.set(false)"
                >
                  <app-icon [name]="icons[item.value]" />
                  <span>{{ item.label }}</span>
                </a>
              </li>
            }
          </ul>
        </nav>
      </div>
    }

    @if (aside.content(); as content) {
      <aside
        class="border-border bg-background flex w-full shrink-0 flex-col overflow-y-auto p-4 [--aside-w:100%] [scrollbar-gutter:stable] md:w-[24rem] md:border-l md:[--aside-w:24rem]"
        animate.enter="aside-enter"
        animate.leave="aside-leave"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </aside>
    }
  `,
})
export class AppShell {
  protected readonly routes = ROUTES;

  protected readonly views = TASK_VIEWS;

  protected readonly icons: Record<TaskView, string> = {
    'my-day': 'lucideSun',
    important: 'lucideStar',
    planned: 'lucideCalendarRange',
    all: 'lucideHouse',
  };

  protected readonly aside = inject(AsideSlot);

  protected readonly sidebar = inject(SidebarStore);

  protected readonly currentUser = inject(CurrentUser);

  protected readonly drawerOpen = signal(false);

  protected readonly navClass = computed(() => {
    const width = this.sidebar.collapsed() ? 'md:w-14' : 'md:w-56';
    const base = `border-border bg-toolbar shrink-0 ${width} md:flex md:flex-col md:overflow-y-auto md:border-r md:p-2 max-md:order-last max-md:border-t max-md:px-2 max-md:pt-1 max-md:pb-[calc(--spacing(1)+env(safe-area-inset-bottom))]`;
    return this.aside.content() ? `${base} max-md:hidden` : base;
  });

  protected readonly linkClass = computed(() => {
    const base =
      'text-foreground-secondary hover:bg-muted hover:text-foreground flex items-center gap-2.5 rounded-md px-2 py-2 text-sm max-md:min-h-11 max-md:flex-col max-md:justify-center max-md:gap-1 max-md:text-xs';
    return this.sidebar.collapsed() ? `${base} md:justify-center` : base;
  });

  protected readonly columnClass = computed(() =>
    this.aside.content()
      ? 'flex min-w-0 min-h-0 flex-1 flex-col max-md:hidden'
      : 'flex min-w-0 min-h-0 flex-1 flex-col',
  );

  protected readonly veil = viewChild.required(NavigationVeil);
}
