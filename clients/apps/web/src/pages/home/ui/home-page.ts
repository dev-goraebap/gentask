import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, FormField, FormRoot } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '@/entities/project';
import { isCompleted, isInMyDay, TaskService, toDateKey } from '@/entities/task';
import { ROUTES } from '@/shared/config';
import { HlmButton } from '@/shared/ui/button';
import { HlmField, HlmFieldLabel } from '@/shared/ui/field';
import { AppIcon } from '@/shared/ui/icon';
import { HlmInput } from '@/shared/ui/input';
import { Veil } from '@/shared/ui/veil';

/** 홈에 늘어놓는 오늘 할 일의 수. 넘는 것은 세어서만 알린다. */
const SHOWN = 5;

/**
 * 홈.
 *
 * <p>처음 닿는 자리다. 오늘 할 일과 프로젝트를 함께 보여 준다 — 이 제품이 다루는 둘이 그것이고,
 * 어느 쪽으로 갈지는 여기서 갈린다.
 *
 * <p>프로젝트 목록을 따로 두지 않는다. 목록만 있는 화면을 하나 더 두면 홈에서 한 번 보고 그 화면에서
 * 또 보게 되며, 프로젝트가 하나뿐인 사람은 볼 일 없는 자리를 지난다.
 */
@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    FormRoot,
    FormField,
    HlmButton,
    HlmField,
    HlmFieldLabel,
    HlmInput,
    AppIcon,
    Veil,
  ],
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-page.html',
})
export class HomePage {
  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly routes = ROUTES;
  private readonly today = toDateKey(new Date());

  // --- 의존 --------------------------------------------------------------------------------------
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly taskService = inject(TaskService);

  // --- 상태 --------------------------------------------------------------------------------------
  protected readonly creating = signal(false);
  private readonly draft = signal({ name: '' });
  protected readonly createForm = form(this.draft);

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly projects = this.projectService.list;
  protected readonly creatable = computed(() => this.draft().name.trim().length > 0);

  protected readonly tasksLoading = computed(() => this.taskService.status() === 'loading');
  protected readonly tasksFailed = computed(() => this.taskService.status() === 'error');

  private readonly openMyDay = computed(() =>
    this.taskService.list().filter((task) => isInMyDay(task, this.today) && !isCompleted(task)),
  );

  protected readonly myDay = computed(() => this.openMyDay().slice(0, SHOWN));
  protected readonly remaining = computed(() => Math.max(0, this.openMyDay().length - SHOWN));

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
    void this.router.navigateByUrl(ROUTES.issues(id));
  }

  protected createOnEnter(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.isComposing) return;
    event.preventDefault();
    this.create();
  }
}
