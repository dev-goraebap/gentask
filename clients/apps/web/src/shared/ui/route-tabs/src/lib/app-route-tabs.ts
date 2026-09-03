import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { EXACT_LINK } from '@/shared/lib';

/** 탭 하나. */
export interface RouteTab {
  readonly label: string;
  readonly link: string;
}

/**
 * 라우터 경로 기반 탭 컴포넌트다. 활성 상태는 data-active 속성으로 표현한다.
 */
@Component({
  selector: 'app-route-tabs',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <nav [class]="LIST" [attr.aria-label]="label()">
      @for (tab of tabs(); track tab.link) {
        <a
          #active="routerLinkActive"
          routerLinkActive
          [routerLinkActiveOptions]="EXACT"
          [routerLink]="tab.link"
          [attr.data-active]="active.isActive ? '' : null"
          [attr.aria-current]="active.isActive ? 'page' : null"
          [class]="TRIGGER"
        >
          {{ tab.label }}
        </a>
      }
    </nav>
  `,
})
export class AppRouteTabs {
  // --- 계약 --------------------------------------------------------------------------------------
  readonly tabs = input.required<readonly RouteTab[]>();

  readonly label = input('관점');

  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly EXACT = EXACT_LINK;

  protected readonly LIST =
    'bg-muted text-muted-foreground inline-flex h-9 w-full items-center justify-center rounded-lg p-[3px]';

  protected readonly TRIGGER =
    'text-foreground/60 hover:text-foreground data-active:bg-background data-active:text-foreground focus-visible:ring-ring/50 inline-flex h-[calc(100%-1px)] min-w-0 flex-1 items-center justify-center gap-1.5 truncate rounded-md px-2 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-[3px] focus-visible:outline-1';
}
