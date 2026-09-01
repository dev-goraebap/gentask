import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HlmButton } from '@/shared/ui/button';
import { AppIcon } from '@/shared/ui/icon';
import { HlmPopoverImports } from '@/shared/ui/popover';
import { ProjectService } from '../api/project-service';

/**
 * 트래커 자리의 머리에 서는 프로젝트 고르개.
 *
 * <p>사이드바가 이것을 직접 알지 않는다. 라우트가 껍데기에 내려 주므로 투두 자리에는 서지 않는다.
 */
@Component({
  selector: 'app-project-picker',
  imports: [HlmButton, HlmPopoverImports, AppIcon],
  host: { class: 'block' },
  template: `
    <hlm-popover align="start" sideOffset="4">
      <button
        hlmPopoverTrigger
        hlmBtn
        type="button"
        variant="outline"
        class="w-full justify-between gap-2"
        aria-label="프로젝트 고르기"
      >
        <span class="flex min-w-0 items-center gap-2">
          <span class="bg-primary size-2.5 shrink-0" aria-hidden="true"></span>
          <span class="truncate">{{ projectService.current().name }}</span>
        </span>
        <app-icon name="hgiArrowDown" />
      </button>

      <hlm-popover-content *hlmPopoverPortal="let ctx" class="w-60 p-1">
        <div role="group" aria-label="프로젝트" class="flex flex-col">
          @for (project of projectService.list(); track project.id) {
            <button
              hlmBtn
              type="button"
              variant="ghost"
              size="sm"
              class="justify-between gap-2"
              [attr.aria-pressed]="project.id === projectService.current().id"
              (click)="choose(project.id); ctx.close()"
            >
              <span class="truncate">{{ project.name }}</span>
              @if (project.id === projectService.current().id) {
                <app-icon name="hgiCheck" />
              }
            </button>
          }
        </div>
      </hlm-popover-content>
    </hlm-popover>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPicker {
  // --- 의존 --------------------------------------------------------------------------------------
  protected readonly projectService = inject(ProjectService);

  // --- 동작 --------------------------------------------------------------------------------------
  protected choose(id: string): void {
    this.projectService.choose(id);
  }
}
