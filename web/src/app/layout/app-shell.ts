import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ROUTES } from '@/shared/config';

/**
 * 모든 화면이 공유하는 셸입니다. 상단 바를 소유하고 본문 자리를 내어 줍니다.
 *
 * 상단 바를 셸에 두면 라우트를 옮겨도 재생성되지 않아 전환 중에 깜빡이지 않습니다.
 * pages 슬라이스는 자신이 어느 레이아웃 안에 놓이는지 알지 못합니다. 06-layout.md 3.1절.
 *
 * 골격은 topbar 이며 스크롤 컨테이너가 문서 전체입니다. 그래서 표면은 bordered 로 고정합니다.
 * 문서 전체가 스크롤되는 구조에서 inset 을 적용하면 콘텐츠 둘레의 배경이 스크롤과 함께
 * 움직여 표면 경계가 스크롤 영역과 어긋납니다. 06-layout.md 2.2절.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-dvh flex-col' },
  template: `
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:bg-primary focus:text-primary-foreground focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2"
    >
      본문으로 건너뛰기
    </a>

    <!--
      불투명도는 toolbar 토큰이 모드별로 정합니다. 여기에 /85 같은 알파 유틸리티를 붙이면
      라이트와 다크에 같은 값이 걸려 다크에서 뒤 요소가 비쳐 보입니다. 04-design-system.md 3.3절.
    -->
    <header class="bg-toolbar border-border sticky top-0 z-40 border-b backdrop-blur-lg">
      <nav class="mx-auto flex h-14 max-w-[66rem] items-center px-4">
        <a [routerLink]="routes.home()" class="text-base font-semibold tracking-tight">할일</a>
      </nav>
    </header>

    <main id="main" class="relative flex-1">
      <router-outlet />
    </main>
  `,
})
export class AppShell {
  protected readonly routes = ROUTES;
}
