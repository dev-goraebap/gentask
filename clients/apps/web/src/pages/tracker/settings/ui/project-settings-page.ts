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
  private readonly draft = signal({
    name: this.projectService.current()?.name ?? '',
    key: this.projectService.current()?.key ?? '',
  });
  protected readonly settingsForm = form(this.draft);

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly rows = computed<readonly RepositoryRow[]>(() =>
    this.projectService.repositories().map((link) => ({
      link,
      icon: repositoryIcon(link.host),
      hostLabel: repositoryHostLabel(link.host),
      pending: isPending(link),
    })),
  );

  /** 담을 것이 있는가. 비어 있거나 모양이 맞지 않으면 담지 않는다. */
  protected readonly savable = computed(() => {
    const { name, key } = this.draft();
    const current = this.projectService.current();
    if (name.trim() === '' || !/^[A-Za-z0-9]+$/.test(key.trim())) return false;
    return name.trim() !== current?.name || key.trim().toUpperCase() !== current?.key;
  });

  // --- 동작 --------------------------------------------------------------------------------------
  /**
   * 이름과 접두어를 담는다.
   *
   * 접두어를 바꿔도 이미 매겨진 번호는 그대로다. 접두어는 이름을 그리는 데만 쓰이고 번호는 표가
   * 갖기 때문이며, 옛 접두어로 적힌 커밋과 테스트는 그 시점의 이름으로 남는다(GT-60 #4).
   */
  protected async save(): Promise<void> {
    if (!this.savable()) return;

    const { name, key } = this.draft();
    await this.projectService.edit({ name: name.trim(), key: key.trim() });
  }

  protected unlink(id: string): void {
    this.projectService.unlink(id);
  }
}
