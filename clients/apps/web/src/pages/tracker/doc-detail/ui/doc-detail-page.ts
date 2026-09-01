import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { buildCrumbs, DocService } from '@/entities/doc';
import { injectProjectRoutes } from '@/entities/project';
import { HlmButton } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { AppIcon } from '@/shared/ui/icon';

@Component({
  selector: 'app-doc-detail',
  imports: [RouterLink, HlmButton, AppIcon, EmptyState],
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  templateUrl: './doc-detail-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocDetailPage {
  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly routes = injectProjectRoutes();

  // --- 계약 --------------------------------------------------------------------------------------
  readonly id = input.required<string>();

  // --- 의존 --------------------------------------------------------------------------------------
  private readonly docService = inject(DocService);

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly doc = computed(() => this.docService.find(this.id()));

  protected readonly crumbs = computed(() =>
    buildCrumbs(this.docService.folders(), this.doc()?.folderId ?? null),
  );

  protected readonly command = computed(() => `gentask doc cat ${this.id()}`);
}
