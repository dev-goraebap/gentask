import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
  lucideCalendarRange,
  lucideHouse,
  lucidePanelLeftClose,
  lucidePanelLeftOpen,
  lucideStar,
  lucideSun,
} from '@ng-icons/lucide';
import { TASK_VIEWS, type TaskView } from '@/entities/task';
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
 * 표면은 bordered 입니다. 선택은 sidebar 골격에서만 유효하지만 아직 전환 수단을 두지
 * 않았고, 두려면 3.4절에 따라 선택값을 첫 페인트 전에 복원해야 합니다.
 *
 * 골격을 두 파일로 쪼개지 않았습니다. 3.1절의 분기는 골격이 둘일 때의 구조이며, topbar 를
 * 쓰는 화면이 없는 동안 빈 분기를 먼저 만들 근거가 없습니다. 라우트가 이 컴포넌트만
 * 참조하므로 나중에 내부를 둘로 나눠도 호출부는 바뀌지 않습니다.
 *
 * 네비게이션 항목은 셸이 압니다. 3절이 "분기하는 것은 골격이지 내용물이 아니다"라고
 * 정하며 네비게이션 항목을 셸의 것으로 둡니다. 항목의 이름은 엔티티가 소유하고 셸은
 * 아이콘과 자리만 정합니다.
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
  ],
  providers: [
    provideIcons({
      lucideCalendarRange,
      lucideHouse,
      lucidePanelLeftClose,
      lucidePanelLeftOpen,
      lucideStar,
      lucideSun,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  /*
   * 전고를 잡고 안쪽을 스크롤합니다. 문서는 스크롤되지 않으므로 가로로 나가는 것도
   * 여기서 잘라 냅니다. aside 가 등장·퇴장 동안 화면 밖에 서기 때문입니다.
   *
   * 좁은 화면에서는 열이 아니라 행으로 쌓습니다. 사이드바가 아래로 내려가 탭 막대가 되며,
   * DOM 과 항목이 같고 자리만 바뀌므로 07-adaptive-ui.md 1절 기준으로 반응형입니다.
   */
  host: { class: 'flex h-dvh overflow-hidden max-md:flex-col' },
  template: `
    <!--
      네비게이션입니다. 넓은 화면에서는 왼쪽 열로 전고를 차지하고, 좁은 화면에서는 마지막
      순서로 내려가 하단 탭이 됩니다. 항목이 넷이라 탭으로 눕혀도 이름이 살아 있습니다.

      aside 가 화면을 덮는 동안에는 함께 감춥니다. 덮인 채로 탭만 남으면 가려진 쪽을
      조작할 수 없는 상태에서 이동 수단만 떠 있게 됩니다. 06-layout.md 3.3절.
    -->
    <nav id="sidebar" [class]="navClass()" aria-label="관점">
      <!-- 접으면 제목이 들어갈 폭이 없습니다. 아이콘 열만 남깁니다. -->
      @if (!sidebar.collapsed()) {
        <a
          [routerLink]="routes.home()"
          class="mb-1 hidden px-2 py-1 text-base font-semibold tracking-tight md:block"
        >
          할일
        </a>
      }

      <ul class="flex gap-1 max-md:justify-around md:flex-col">
        @for (item of views; track item.value) {
          <li class="max-md:flex-1">
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
          사이드바를 접고 펴는 버튼입니다. 좁은 화면에서는 네비게이션이 하단 탭이라 접을
          것이 없으므로 감춥니다. 상태는 이름과 aria-expanded 둘 다로 알립니다.
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
        <a [routerLink]="routes.home()" class="text-base font-semibold tracking-tight md:hidden">
          할일
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

  /**
   * 네비게이션입니다. 넓은 화면에서는 왼쪽 열, 좁은 화면에서는 하단 탭입니다.
   *
   * 하단 탭에는 `env(safe-area-inset-bottom)` 을 더합니다. 더하지 않으면 홈 인디케이터가
   * 있는 기기에서 마지막 줄이 그 아래로 들어갑니다. 06-layout.md 3.2절.
   */
  protected readonly navClass = computed(() => {
    const width = this.sidebar.collapsed() ? 'md:w-14' : 'md:w-56';
    const base = `border-border bg-toolbar shrink-0 ${width} md:overflow-y-auto md:border-r md:p-2 max-md:order-last max-md:border-t max-md:px-2 max-md:pt-1 max-md:pb-[calc(--spacing(1)+env(safe-area-inset-bottom))]`;
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
