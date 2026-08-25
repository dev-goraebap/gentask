import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { form, FormField, FormRoot } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
  lucideAlarmClock,
  lucideArrowDown,
  lucideArrowUp,
  lucideArrowDownUp,
  lucideCalendar,
  lucideCalendarArrowDown,
  lucideCalendarCheck,
  lucideCalendarRange,
  lucideChevronRight,
  lucideChevronsRight,
  lucideCircleArrowRight,
  lucideClock,
  lucideStar,
  lucideSun,
  lucideX,
} from '@ng-icons/lucide';
import { ROUTES, TASK_PANEL } from '@/shared/config';
import { AsideOutlet } from '@/shared/lib';
import { HlmButton } from '@/shared/ui/button';
import { Veil } from '@/shared/ui/veil';
import { HlmCheckbox } from '@/shared/ui/checkbox';
import { HlmDatePicker, HlmDatePickerTrigger } from '@/shared/ui/date-picker';
import { HlmField, HlmFieldLabel } from '@/shared/ui/field';
import { AppIcon } from '@/shared/ui/icon';
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
  type SortDirection,
  toTaskView,
  type Task,
  type TaskSort,
  type TaskView,
} from '@/entities/task';
import { TaskService, type TaskSeed } from '../api/task-service';

@Component({
  selector: 'app-task-list',
  imports: [
    FormRoot,
    FormField,
    RouterLink,
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
    Veil,
  ],
  providers: [
    provideIcons({
      lucideAlarmClock,
      lucideArrowDown,
      lucideArrowUp,
      lucideArrowDownUp,
      lucideCalendar,
      lucideCalendarArrowDown,
      lucideCalendarCheck,
      lucideCalendarRange,
      lucideChevronRight,
      lucideChevronsRight,
      lucideCircleArrowRight,
      lucideClock,
      lucideStar,
      lucideSun,
      lucideX,
    }),
  ],
  host: {
    class: 'flex min-h-0 flex-1 flex-col',
    '[attr.aria-busy]': 'veil().visible() || null',
  },
  templateUrl: './task-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListPage {
  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly routes = ROUTES;
  protected readonly panel = TASK_PANEL;
  protected readonly sortOptions = TASK_SORTS;
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

  // --- 질의 --------------------------------------------------------------------------------------
  protected readonly veil = viewChild.required(Veil);

  // --- 상태 --------------------------------------------------------------------------------------
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

  protected addOnEnter(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.isComposing) return;

    event.preventDefault();
    void this.add();
  }

  protected async setCompleted(task: Task, completed: boolean, box: HlmCheckbox): Promise<void> {
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

const EMPTY_MESSAGES: Record<TaskView, string> = {
  'my-day': '오늘 할 것으로 담은 항목이 없습니다. 항목을 열어 나의 하루에 담아 보세요.',
  important: '중요 표시를 켠 항목이 없습니다. 목록에서 별을 눌러 표시할 수 있습니다.',
  planned: '기한을 정한 항목이 없습니다. 항목을 열어 기한을 정해 보세요.',
  all: '작업이 없습니다. 아래에 입력해 하나 추가해 보세요.',
};

const DUE_ICONS = ['lucideCalendarCheck', 'lucideCalendarArrowDown', 'lucideCalendarRange'];

const REMIND_ICONS = ['lucideClock', 'lucideCircleArrowRight', 'lucideChevronsRight'];
