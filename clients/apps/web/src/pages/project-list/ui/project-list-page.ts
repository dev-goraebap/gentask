import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, FormField, FormRoot } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '@/entities/project';
import { ROUTES } from '@/shared/config';
import { HlmButton } from '@/shared/ui/button';
import { HlmField, HlmFieldLabel } from '@/shared/ui/field';
import { AppIcon } from '@/shared/ui/icon';
import { HlmInput } from '@/shared/ui/input';
import { AppPageBack } from '@/shared/ui/page-back';

/**
 * 프로젝트들.
 *
 * <p>계정 자리에 선다. 프로젝트는 모드가 아니라 계정에 매이므로 투두에도 트래커에도 속하지 않는다.
 *
 * <p>넓은 화면에서도 이 자리에 머무른다. 사이드바의 고르개는 들어갈 프로젝트를 고르는 것이고,
 * 여기는 프로젝트 자체를 다루는 자리라 하는 일이 다르다.
 *
 * <p>좁은 화면에서는 트래커로 들어가는 첫 단계이기도 하다. 고른 프로젝트의 메뉴로 들어가고, 거기서
 * 목록을, 목록에서 상세로 들어간다.
 */
@Component({
  selector: 'app-project-list',
  imports: [AppPageBack, 
    RouterLink,
    FormRoot,
    FormField,
    HlmButton,
    HlmField,
    HlmFieldLabel,
    HlmInput,
    AppIcon,
  ],
  host: { class: 'flex min-h-0 flex-1 flex-col overflow-y-auto' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-list-page.html',
})
export class ProjectListPage {
  // --- 의존 --------------------------------------------------------------------------------------
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);

  // --- 상태 --------------------------------------------------------------------------------------
  protected readonly creating = signal(false);
  private readonly draft = signal({ name: '' });
  protected readonly createForm = form(this.draft);

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly projects = this.projectService.list;
  protected readonly routes = ROUTES;
  protected readonly creatable = computed(() => this.draft().name.trim().length > 0);

  // --- 동작 --------------------------------------------------------------------------------------
  protected startCreating(): void {
    this.draft.set({ name: '' });
    this.creating.set(true);
  }

  protected cancelCreating(): void {
    this.creating.set(false);
    this.draft.set({ name: '' });
  }

  protected create(): void {
    const name = this.draft().name.trim();
    if (name === '') return;

    const id = this.projectService.create(name);
    this.cancelCreating();

    // 세운 것으로 곧장 들어간다. 세우고 나서 다시 고르게 하면 방금 한 일을 한 번 더 시킨다.
    void this.router.navigateByUrl(ROUTES.project(id));
  }

  protected createOnEnter(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.isComposing) return;
    event.preventDefault();
    this.create();
  }
}
