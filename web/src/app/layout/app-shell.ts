import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
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

/**
 * 모든 화면이 공유하는 셸입니다. 네비게이션을 소유하고 본문 자리를 내어 줍니다.
 *
 * 골격은 sidebar 입니다. 06-layout.md 2.1절 기준으로 실질적 차이는 스크롤 컨테이너의
 * 위치이며, 문서 전체가 아니라 콘텐츠 박스가 스크롤됩니다. 그 대가로 라우터의 스크롤 위치
 * 복원이 닿지 않으므로, 필요해지면 직접 구현해야 합니다. 같은 문서 4.3절.
 *
 * 넓은 화면의 사이드바는 스마트 목록을 갖고 하단에 내 프로필이 고정됩니다(TK-006).
 * 좁은 화면의 하단 탭은 최상위 구획(할일 · 계정) 둘뿐입니다 — 스마트 목록 넷을 탭으로
 * 눕히면 계정이 들어올 자리가 없습니다. 스마트 목록은 헤더의 버튼이 여는 드로어로
 * 옮겨 갑니다. ST-015.
 *
 * 네비게이션 항목은 셸이 압니다. 06-layout.md 3절이 "분기하는 것은 골격이지 내용물이
 * 아니다"라고 정하며 네비게이션 항목을 셸의 것으로 둡니다. 항목의 이름은 엔티티가
 * 소유하고 셸은 아이콘과 자리만 정합니다.
 */
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
  /*
   * 전고를 잡고 안쪽을 스크롤합니다. 문서는 스크롤되지 않으므로 가로로 나가는 것도
   * 여기서 잘라 냅니다. aside 가 등장·퇴장 동안 화면 밖에 서기 때문입니다.
   *
   * 좁은 화면에서는 열이 아니라 행으로 쌓습니다. 하단 탭이 마지막 순서로 내려가며,
   * DOM 과 자리만 바뀌므로 07-adaptive-ui.md 1절 기준으로 반응형입니다.
   */
  host: { class: 'flex h-dvh overflow-hidden max-md:flex-col' },
  template: `
    <!--
      네비게이션입니다. 넓은 화면에서는 왼쪽 열로 전고를 차지하고, 좁은 화면에서는 마지막
      순서로 내려가 하단 탭이 됩니다.

      aside 가 화면을 덮는 동안에는 함께 감춥니다. 덮인 채로 탭만 남으면 가려진 쪽을
      조작할 수 없는 상태에서 이동 수단만 떠 있게 됩니다. 06-layout.md 3.3절.
    -->
    <nav id="sidebar" [class]="navClass()" aria-label="탐색">
      <!-- 접으면 제목이 들어갈 폭이 없습니다. 아이콘 열만 남깁니다. -->
      @if (!sidebar.collapsed()) {
        <a
          [routerLink]="routes.home()"
          class="mb-1 hidden px-2 py-1 text-base font-semibold tracking-tight md:block"
        >
          작업
        </a>
      }

      <!-- 스마트 목록. 넓은 화면 전용이며 좁은 화면에서는 드로어가 같은 항목을 갖습니다. -->
      <ul class="hidden gap-1 md:flex md:flex-col">
        @for (item of views; track item.value) {
          <li>
            <!--
              현재 자리를 aria-current 로 알립니다. 색과 배경만으로 알리면 색각 이상과
              흑백 출력에서 전달되지 않습니다. 13-accessibility.md 4절.
            -->
            <!--
              접힌 동안에는 이름이 보이지 않으므로 접근 가능한 이름을 속성으로 줍니다.
              아이콘만 남은 링크는 이름을 가져야 합니다. 13-accessibility.md 3절.
            -->
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

      <!--
        내 프로필. 사이드바 하단에 고정되어 계정 화면으로 가는 길이 됩니다. ST-015.
        사본이 오기 전에는 자리를 비워 둡니다 — 로그인 전이거나 아직 받는 중입니다.
      -->
      @if (currentUser.me(); as me) {
        <a
          [routerLink]="routes.account()"
          routerLinkActive="bg-muted text-foreground"
          class="text-foreground-secondary hover:bg-muted hover:text-foreground mt-auto hidden items-center gap-2.5 rounded-md px-2 py-2 md:flex"
          [class.md:justify-center]="sidebar.collapsed()"
          [attr.aria-label]="sidebar.collapsed() ? '계정' : null"
          [attr.title]="sidebar.collapsed() ? '계정' : null"
        >
          <app-user-avatar class="size-7 text-xs" [name]="me.nickname" [imageUrl]="me.profileImageUrl" />
          @if (!sidebar.collapsed()) {
            <span class="min-w-0 flex-1 truncate text-sm">{{ me.nickname }}</span>
          }
        </a>
      }

      <!-- 하단 탭. 최상위 구획 둘뿐입니다. 스마트 목록은 드로어가 갖습니다. ST-015. -->
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

    <!--
      콘텐츠 열입니다. min-w-0 이 없으면 긴 내용이 있는 화면에서 열이 밀려 나갑니다.
      06-layout.md 4.2절.

      좁은 화면에서 aside 가 차면 통째로 감춥니다. 나란히 놓을 폭이 없어 aside 가 화면을
      덮으며, 그 안의 닫기가 되돌아갈 길을 갖습니다. 06-layout.md 3.3절.
    -->
    <div [class]="columnClass()">
      <a
        href="#main"
        class="sr-only focus:not-sr-only focus:bg-primary focus:text-primary-foreground focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2"
      >
        본문으로 건너뛰기
      </a>

      <!--
        헤더가 콘텐츠 열 안에 놓이는 것이 sidebar 골격입니다. 06-layout.md 2.1절.
        불투명도는 toolbar 토큰이 모드별로 정합니다. 04-design-system.md 3.3절.
      -->
      <header class="bg-toolbar border-border flex h-14 shrink-0 items-center gap-4 border-b px-4">
        <!--
          사이드바를 접고 펴는 버튼입니다. 좁은 화면에서는 같은 자리가 스마트 목록
          드로어를 엽니다 — 하단 탭이 최상위 구획만 갖기 때문입니다. 상태는 이름과
          aria-expanded 둘 다로 알립니다.
        -->
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

      <!--
        스크롤 컨테이너입니다. 골격이 sidebar 라 문서가 아니라 이 박스가 스크롤되며,
        화면 안의 sticky 는 이 상자를 기준으로 섭니다. 06-layout.md 4.5절.

        스크롤바 자리를 늘 확보해 화면마다 콘텐츠 폭이 달라지지 않게 합니다. 4.1절.

        베일의 기준 상자이기도 합니다. 여백을 여기 두지 않는 이유는 기준 상자가 눈에 보이는
        콘텐츠 영역과 정확히 같아야 하기 때문입니다. 10-loading.md 7.1절.
      -->
      <main
        id="main"
        class="relative flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-gutter:stable]"
        [attr.aria-busy]="veil().visible() || null"
      >
        <app-navigation-veil />
        <router-outlet />
      </main>
    </div>

    <!--
      좁은 화면의 스마트 목록 드로어입니다. 하단 탭이 최상위 구획만 가지므로 관점을
      고르는 자리가 여기입니다. 항목은 넓은 화면의 사이드바와 같습니다. ST-015.
    -->
    @if (drawerOpen()) {
      <div class="fixed inset-0 z-40 md:hidden">
        <!-- 가림막을 누르면 닫힙니다. 드로어는 이동 수단이라 오래 머무는 자리가 아닙니다. -->
        <div class="bg-veil absolute inset-0" aria-hidden="true" (click)="drawerOpen.set(false)"></div>
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

    <!--
      aside 슬롯입니다. 전고를 차지하며 콘텐츠 열을 밀어냅니다. 콘텐츠 위에 겹치지 않는
      것은 5.2절 배너와 같은 원리이며, 겹치면 가려진 쪽을 조작할 수 없습니다.

      셸은 슬롯이 찼는지만 알고 무엇이 들었는지는 모릅니다. 06-layout.md 3.1절과 3.3절.
    -->
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

  /** 관점마다의 아이콘입니다. 이름은 엔티티가, 표현은 셸이 갖습니다. */
  protected readonly icons: Record<TaskView, string> = {
    'my-day': 'lucideSun',
    important: 'lucideStar',
    planned: 'lucideCalendarRange',
    all: 'lucideHouse',
  };

  protected readonly aside = inject(AsideSlot);

  protected readonly sidebar = inject(SidebarStore);

  protected readonly currentUser = inject(CurrentUser);

  /** 좁은 화면의 스마트 목록 드로어. 이동하면 닫힙니다. */
  protected readonly drawerOpen = signal(false);

  /**
   * 네비게이션입니다. 넓은 화면에서는 왼쪽 열, 좁은 화면에서는 하단 탭입니다.
   *
   * 하단 탭에는 `env(safe-area-inset-bottom)` 을 더합니다. 더하지 않으면 홈 인디케이터가
   * 있는 기기에서 마지막 줄이 그 아래로 들어갑니다. 06-layout.md 3.2절.
   */
  protected readonly navClass = computed(() => {
    const width = this.sidebar.collapsed() ? 'md:w-14' : 'md:w-56';
    const base = `border-border bg-toolbar shrink-0 ${width} md:flex md:flex-col md:overflow-y-auto md:border-r md:p-2 max-md:order-last max-md:border-t max-md:px-2 max-md:pt-1 max-md:pb-[calc(--spacing(1)+env(safe-area-inset-bottom))]`;
    return this.aside.content() ? `${base} max-md:hidden` : base;
  });

  /** 접히면 아이콘을 가운데 세웁니다. 좁은 화면의 탭 배치는 그대로입니다. */
  protected readonly linkClass = computed(() => {
    const base =
      'text-foreground-secondary hover:bg-muted hover:text-foreground flex items-center gap-2.5 rounded-md px-2 py-2 text-sm max-md:min-h-11 max-md:flex-col max-md:justify-center max-md:gap-1 max-md:text-xs';
    return this.sidebar.collapsed() ? `${base} md:justify-center` : base;
  });

  /**
   * 헤더와 본문을 담는 열입니다. 좁은 화면에서 aside 가 차면 통째로 감춥니다.
   *
   * 폭을 재는 것은 CSS 이고 이 값은 슬롯이 찼는지만 말합니다. DOM 이 같고 레이아웃만
   * 바뀌므로 07-adaptive-ui.md 1절 기준으로 적응형이 아니라 반응형입니다.
   */
  protected readonly columnClass = computed(() =>
    this.aside.content()
      ? 'flex min-w-0 min-h-0 flex-1 flex-col max-md:hidden'
      : 'flex min-w-0 min-h-0 flex-1 flex-col',
  );

  /** 대기 사실을 보조 기술에 알리기 위해 베일의 상태를 읽습니다. 13-accessibility.md 7절. */
  protected readonly veil = viewChild.required(NavigationVeil);
}
