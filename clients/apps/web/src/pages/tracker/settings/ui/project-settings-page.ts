import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, FormField, FormRoot } from '@angular/forms/signals';
import {
  isPending,
  ProjectService,
  repositoryHostLabel,
  repositoryIcon,
  type RepositoryLink,
} from '@/entities/project';
import { HlmButton } from '@/shared/ui/button';
import { HlmField, HlmFieldLabel } from '@/shared/ui/field';
import { AppIcon, type IconName } from '@/shared/ui/icon';
import { HlmInput } from '@/shared/ui/input';
import { injectProjectRoutes } from '@/entities/project';

/** 이어 둔 저장소 한 줄. 아이콘과 이름표를 미리 골라 템플릿이 매번 다시 고르지 않는다. */
interface RepositoryRow {
  readonly link: RepositoryLink;
  readonly icon: IconName;
  readonly hostLabel: string;
  readonly pending: boolean;
}

@Component({
  selector: 'app-project-settings',
  imports: [FormRoot, FormField, HlmButton, HlmInput, HlmField, HlmFieldLabel, AppIcon],
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  templateUrl: './project-settings-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSettingsPage {
  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly routes = injectProjectRoutes();

  // --- 의존 --------------------------------------------------------------------------------------
  protected readonly projectService = inject(ProjectService);

  // --- 상태 --------------------------------------------------------------------------------------
  private readonly draft = signal({ name: this.projectService.current().name });
  protected readonly nameForm = form(this.draft);

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly rows = computed<readonly RepositoryRow[]>(() =>
    this.projectService.repositories().map((link) => ({
      link,
      icon: repositoryIcon(link.host),
      hostLabel: repositoryHostLabel(link.host),
      pending: isPending(link),
    })),
  );

  protected readonly renamed = computed(
    () =>
      this.draft().name.trim() !== '' &&
      this.draft().name.trim() !== this.projectService.current().name,
  );

  // --- 동작 --------------------------------------------------------------------------------------
  protected rename(): void {
    const name = this.draft().name.trim();
    if (name === '') return;
    this.projectService.rename(name);
  }

  protected unlink(id: string): void {
    this.projectService.unlink(id);
  }
}
