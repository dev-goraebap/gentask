import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  type ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { form, FormField, FormRoot } from '@angular/forms/signals';
import { DOCUMENT } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ROUTES, TASK_PANEL } from '@/shared/config';
import { AsideOutlet } from '@/shared/lib';
import { AppRouteTabs } from '@/shared/ui/route-tabs';
import { HlmButton } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { HlmCheckbox } from '@/shared/ui/checkbox';
import { HlmDatePicker, HlmDatePickerTrigger } from '@/shared/ui/date-picker';
import { HlmField, HlmFieldLabel } from '@/shared/ui/field';
import { AppIcon, type IconName } from '@/shared/ui/icon';
import { HlmInput } from '@/shared/ui/input';
import { HlmPopoverImports } from '@/shared/ui/popover';
import { toast } from '@/shared/ui/sonner';
import { TaskDetailPanel } from './task-detail-panel';
import {
  toDateTimeKey,
  filterByView,
  DEFAULT_REMIND_TIME,
  describeDueBrief,
  describeRemind,
  fromDateKey,
  fromDateTimeKey,
  isInMyDay,
  isAddableTitle,
  isOverdue,
  isRemindPast,
  quickDues,
  quickReminds,
  sortActive,
  sortCompleted,
  splitByCompletion,
  taskViewLabel,
  toDateKey,
  toTaskSort,
  toSortDirection,
  withRemindDate,
  DEFAULT_DIRECTION,
  TASK_SORTS,
  TASK_VIEWS,
  type SortDirection,
  toTaskView,
  type Task,
  type TaskSort,
  type TaskView,
  TaskService,
  type TaskSeed,
} from '@/entities/task';

@Component({
  selector: 'app-task-list',
  imports: [
    FormRoot,
    FormField,
    RouterLink,
    AppRouteTabs,
    HlmButton,
    HlmInput,
    HlmPopoverImports,
    HlmCheckbox,
    AppIcon,
    HlmDatePicker,
    HlmDatePickerTrigger,
    HlmField,
    HlmFieldLabel,
    TaskDetailPanel,
    AsideOutlet,
    EmptyState,
  ],
  host: {
    class: 'flex min-h-0 flex-1 flex-col',
  },
  templateUrl: './task-list-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListPage {
  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly routes = ROUTES;
  protected readonly panel = TASK_PANEL;
  protected readonly sortOptions = TASK_SORTS;
  protected readonly viewTabs = computed(() =>
    TASK_VIEWS.map((view) => ({ label: view.label, link: ROUTES.taskList(view.value) })),
  );
  private readonly today = toDateKey(new Date());
  private readonly now = new Date();

  // --- 계약 --------------------------------------------------------------------------------------
  readonly done = input(false, { transform: booleanAttribute });
  readonly sort = input<string | undefined>(undefined);
  readonly dir = input<string | undefined>(undefined);
  readonly view = input<TaskView, string | undefined>('all', { transform: toTaskView });
  readonly task = input<string | undefined>(undefined);

  // --- 의존 --------------------------------------------------------------------------------------
  protected readonly taskService = inject(TaskService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  // --- 질의 --------------------------------------------------------------------------------------
  private readonly addInput = viewChild<ElementRef<HTMLInputElement>>('addInput');
  private readonly addFormEl = viewChild<ElementRef<HTMLFormElement>>('addFormEl');

  // --- 상태 --------------------------------------------------------------------------------------
  /**
   * 좁은 화면에서 적는 자리가 열려 있는가.
   *
   * <p>늘 열어 두면 바닥의 띠와 함께 화면의 아래를 두 겹으로 먹는다. 적는 일은 잠깐이고 보는 일은
   * 길므로, 평소에는 접어 두고 더하기를 눌렀을 때만 연다. 넓은 화면에서는 그 자리를 다투지 않으므로
   * 늘 열려 있다.
   */
  protected readonly composing = signal(false);

  private readonly draft = signal({ title: '' });
  private readonly draftDue = signal<string | null>(null);
  private readonly draftRemind = signal<string | null>(null);
  protected readonly addForm = form(this.draft);

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly sortKey = computed<TaskSort>(() => toTaskSort(this.sort()));

  protected readonly direction = computed<SortDirection>(() =>
    toSortDirection(this.dir(), this.sortKey()),
  );

  protected readonly listLoading = computed(() => this.taskService.status() === 'loading');

  /**
   * 방금 완료를 눌러 목록에서 빠질 행.
   *
   * <p>사라지는 것을 그리는 대상을 이 하나로 좁힌다. 모든 행에 걸면 뷰를 옮길 때 옛 목록 전체가
   * 자리를 쥔 채 사라지고, 그 동안 빈 안내가 아래로 밀려 상자가 컸다가 줄어든다. 목록이 통째로
   * 갈리는 것은 무엇이 없어진 일이 아니므로 그릴 것도 없다.
   */
  protected readonly leavingId = signal<string | null>(null);
  protected readonly listFailed = computed(() => this.taskService.status() === 'error');

  protected readonly groups = computed(() => {
    const chosen = filterByView(this.taskService.list(), this.view(), this.today);
    const { active, completed } = splitByCompletion(chosen);
    return {
      active: sortActive(active, this.sortKey(), this.direction()),
      completed: sortCompleted(completed),
    };
  });

  protected readonly title = computed(() => taskViewLabel(this.view()));
  protected readonly emptyMessage = computed(() => EMPTY_MESSAGES[this.view()]);

  private readonly viewSeed = computed<TaskSeed>(() => {
    switch (this.view()) {
      case 'my-day':
        return { inMyDay: true };
      case 'important':
        return { important: true };
      case 'planned':
        return { dueDate: this.today };
      case 'all':
        return {};
    }
  });

  protected readonly seed = computed<TaskSeed>(() => {
    const due = this.draftDue();
    const remind = this.draftRemind();
    return {
      ...this.viewSeed(),
      ...(due !== null ? { dueDate: due } : {}),
      ...(remind !== null ? { remindAt: remind } : {}),
    };
  });

  protected readonly draftDueDate = computed<Date | undefined>(() => {
    const key = this.draftDue();
    return key ? (fromDateKey(key) ?? undefined) : undefined;
  });

  protected readonly draftDueKey = computed(() => this.draftDue());
  protected readonly draftRemindAt = computed(() => this.draftRemind());

  protected readonly draftRemindDate = computed<Date | undefined>(() => {
    const at = this.draftRemind();
    return at ? (fromDateTimeKey(at) ?? undefined) : undefined;
  });

  protected readonly quickDue = computed(() =>
    quickDues(this.now).map((q, index) => ({ ...q, icon: DUE_ICONS[index] })),
  );

  protected readonly quickRemind = computed(() =>
    quickReminds(this.now).map((q, index) => ({ ...q, icon: REMIND_ICONS[index] })),
  );

  protected readonly sortActive = computed(
    () => this.sort() !== undefined || this.dir() !== undefined,
  );

  protected readonly sortChip = computed(
    () => TASK_SORTS.find((s) => s.value === this.sortKey())?.chip ?? '',
  );

  protected readonly openTask = computed<Task | undefined>(() => {
    const id = this.task();
    return id ? this.taskService.list().find((candidate) => candidate.id === id) : undefined;
  });

  // --- 동작 --------------------------------------------------------------------------------------
  protected readonly formatRemindChip = (date: Date): string =>
    `알림 ${describeRemind(withRemindDate(this.draftRemind(), date, DEFAULT_REMIND_TIME), this.today)}`;

  protected setDraftRemindDate(date: Date | null): void {
    this.draftRemind.set(
      date ? withRemindDate(this.draftRemind(), date, DEFAULT_REMIND_TIME) : null,
    );
  }

  protected setDraftDue(date: Date | null): void {
    this.draftDue.set(date ? toDateKey(date) : null);
  }

  protected pickQuickDue(date: Date, picker: { close(): void }): void {
    this.setDraftDue(date);
    picker.close();
  }

  protected pickQuickRemind(at: string, picker: { close(): void }): void {
    this.draftRemind.set(at);
    picker.close();
  }

  protected flipSort(): void {
    this.setSort(this.sortKey());
  }

  protected clearSort(): void {
    void this.router.navigate([], {
      queryParams: { sort: null, dir: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected setSort(next: TaskSort): void {
    const direction: SortDirection =
      next === this.sortKey()
        ? this.direction() === 'asc'
          ? 'desc'
          : 'asc'
        : DEFAULT_DIRECTION[next];
    void this.router.navigate([], {
      queryParams: {
        sort: next,
        dir: direction === DEFAULT_DIRECTION[next] ? null : direction,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected describeDue(due: string): string {
    return describeDueBrief(due, this.today);
  }

  protected isDueToday(task: Task): boolean {
    return task.dueDate === this.today;
  }

  protected inMyDay(task: Task): boolean {
    return isInMyDay(task, this.today);
  }

  protected isOverdue(task: Task): boolean {
    return isOverdue(task, this.today);
  }

  protected describeRemind(at: string): string {
    return describeRemind(at, this.today);
  }

  protected isRemindPast(task: Task): boolean {
    return isRemindPast(task, toDateTimeKey(this.now));
  }

  // --- 생성 --------------------------------------------------------------------------------------
  constructor() {
    /*
     * 가상 키보드는 포커스를 따라 올라온다. 여는 것과 맞추는 것을 한 번에 끝내지 않으면 사용자가
     * 두 번 누르게 된다.
     *
     * <p>효과가 그 자리인 이유는 감춰진 요소에 포커스를 줄 수 없기 때문이다. 여는 순간에 바로 부르면
     * 아직 `hidden` 이 붙어 있어 아무 일도 일어나지 않는다. 효과는 그 뷰의 변경 감지 뒤에 돈다.
     */
    effect(() => {
      if (!this.composing()) return;
      this.addInput()?.nativeElement.focus();
    });
  }

  protected startComposing(): void {
    this.composing.set(true);
  }

  /**
   * 적은 것이 없이 자리를 뜨면 접는다. 비운 채로 남겨 두면 접는 단추를 따로 찾아야 한다.
   *
   * <p>초점을 잃는 그 순간에 접으면 <b>제 안의 단추를 삼킨다.</b> 기한과 미리 알림은 이 폼 안에
   * 있어서, 제목을 적기 전에 그것을 누르면 초점이 옮겨 가는 사이에 폼이 사라져 누르려던 것이
   * 없어진다. 초점이 어디에 앉았는지 본 뒤에 판단한다.
   *
   * <p>덮개도 함께 본다. 데이트피커는 오버레이로 뜨므로 그 안에 앉은 초점은 폼 밖에 있다.
   */
  protected stopComposingIfEmpty(): void {
    if (isAddableTitle(this.draft().title)) return;

    setTimeout(() => {
      const active = this.document.activeElement;
      const inForm = this.addFormEl()?.nativeElement.contains(active) ?? false;
      const inOverlay = active?.closest('.cdk-overlay-container') !== null;

      if (inForm || inOverlay) return;
      this.composing.set(false);
    });
  }

  protected addOnEnter(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.isComposing) return;

    event.preventDefault();
    void this.add();
  }

  protected async setCompleted(task: Task, completed: boolean, box: HlmCheckbox): Promise<void> {
    this.leavingId.set(task.id);
    await new Promise((resolve) => setTimeout(resolve, CHECK_DWELL_MS));
    try {
      await this.taskService.setCompleted(task.id, completed);
    } catch {
      box.checked.set(!completed);
      toast.error(completed ? '완료하지 못했습니다.' : '되돌리지 못했습니다.');
      return;
    }
  }

  protected async setImportant(task: Task, important: boolean): Promise<void> {
    await this.taskService.setImportant(task.id, important);
  }

  protected toggleCompleted(): void {
    void this.router.navigate([], {
      queryParams: { done: this.done() ? null : 1 },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private async add(): Promise<void> {
    if (!isAddableTitle(this.draft().title)) return;

    try {
      await this.taskService.add(this.draft().title, this.seed());
    } catch {
      toast.error('작업을 추가하지 못했습니다.', {
        action: { label: '다시 시도', onClick: () => void this.add() },
      });
      return;
    }

    this.addForm().reset({ title: '' });
    this.draftDue.set(null);
    this.draftRemind.set(null);
  }
}

const CHECK_DWELL_MS = 240;

/** 보여 줄 것이 없을 때의 제목과 안내. 제목은 무엇이 없는지, 안내는 무엇을 하면 되는지를 갖는다. */
const EMPTY_MESSAGES: Record<TaskView, { readonly title: string; readonly description: string }> = {
  'my-day': {
    title: '오늘 할 것으로 담은 항목이 없습니다',
    description: '항목을 열어 나의 하루에 담아 보세요.',
  },
  important: {
    title: '중요 표시를 켠 항목이 없습니다',
    description: '목록에서 별을 눌러 표시할 수 있습니다.',
  },
  planned: {
    title: '기한을 정한 항목이 없습니다',
    description: '항목을 열어 기한을 정해 보세요.',
  },
  all: {
    title: '작업이 없습니다',
    description: '아래에 입력해 하나 추가해 보세요.',
  },
};

const DUE_ICONS: readonly IconName[] = ['hgiCalendarCheck', 'hgiCalendarDue', 'hgiCalendarRange'];

const REMIND_ICONS: readonly IconName[] = ['hgiClock', 'hgiCircleArrowRight', 'hgiArrowRightDouble'];
