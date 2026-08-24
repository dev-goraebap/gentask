import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  type ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { form, FormField, FormRoot, requiredError, validate } from '@angular/forms/signals';
import { Router } from '@angular/router';
import {
  DEFAULT_REMIND_TIME,
  describeRemind,
  fromDateKey,
  fromDateTimeKey,
  HOURS12,
  isAddableTitle,
  isCompleted,
  isInMyDay,
  joinTime,
  MERIDIEMS,
  MINUTES,
  quickDues,
  quickReminds,
  remindTimeKey,
  splitTime,
  TaskCommands,
  toDateKey,
  withRemindDate,
  withRemindTime,
  type Meridiem,
  type Task,
  type TaskDraft,
} from '@/entities/task';
import { problemDetail } from '@/shared/api';
import { TASK_PANEL } from '@/shared/config';
import { openUppyDialog } from '@/shared/lib';
import { toast } from '@/shared/ui/sonner';
import { injectTaskFiles } from '../api/task-files';
import {
  HlmAlertDialog,
  HlmAlertDialogAction,
  HlmAlertDialogCancel,
  HlmAlertDialogContent,
  HlmAlertDialogDescription,
  HlmAlertDialogFooter,
  HlmAlertDialogHeader,
  HlmAlertDialogPortal,
  HlmAlertDialogTitle,
  HlmAlertDialogTrigger,
} from '@/shared/ui/alert-dialog';
import { HlmButton } from '@/shared/ui/button';
import { HlmCheckbox } from '@/shared/ui/checkbox';
import { HlmDatePicker, HlmDatePickerTrigger } from '@/shared/ui/date-picker';
import { HlmField, HlmFieldError, HlmFieldLabel } from '@/shared/ui/field';
import { AppIcon } from '@/shared/ui/icon';
import { HlmInput } from '@/shared/ui/input';
import { HlmTextarea } from '@/shared/ui/textarea';
import { provideIcons } from '@ng-icons/core';
import {
  lucideAlarmClock,
  lucideCalendar,
  lucideCalendarArrowDown,
  lucideCalendarCheck,
  lucideCalendarRange,
  lucideChevronsRight,
  lucideCircleArrowRight,
  lucideClock,
  lucideFile,
  lucidePaperclip,
  lucideStar,
  lucideSun,
  lucideTrash2,
  lucideX,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-task-detail-panel',
  imports: [
    FormRoot,
    FormField,
    AppIcon,
    HlmButton,
    HlmCheckbox,
    HlmInput,
    HlmTextarea,
    HlmField,
    HlmFieldLabel,
    HlmFieldError,
    HlmDatePicker,
    HlmDatePickerTrigger,
    HlmAlertDialog,
    HlmAlertDialogAction,
    HlmAlertDialogCancel,
    HlmAlertDialogContent,
    HlmAlertDialogDescription,
    HlmAlertDialogFooter,
    HlmAlertDialogHeader,
    HlmAlertDialogPortal,
    HlmAlertDialogTitle,
    HlmAlertDialogTrigger,
  ],
  providers: [
    provideIcons({
      lucideAlarmClock,
      lucideCalendar,
      lucideCalendarArrowDown,
      lucideCalendarCheck,
      lucideCalendarRange,
      lucideChevronsRight,
      lucideCircleArrowRight,
      lucideClock,
      lucideFile,
      lucidePaperclip,
      lucideStar,
      lucideSun,
      lucideTrash2,
      lucideX,
    }),
  ],
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  templateUrl: './task-detail-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailPanel {
  readonly task = input.required<Task | undefined>();

  readonly changed = output<void>();

  private readonly commands = inject(TaskCommands);
  private readonly router = inject(Router);

  private readonly draft = signal<TaskDraft>({
    title: '',
    note: '',
    dueDate: null,
    remindAt: null,
  });

  protected readonly editForm = form(this.draft, (p) => {
    validate(p.title, ({ value }) =>
      isAddableTitle(value()) ? undefined : requiredError({ message: '제목을 입력해 주세요.' }),
    );
  });

  private readonly confirm = viewChild(HlmAlertDialog);

  private readonly files = injectTaskFiles(computed(() => this.task()?.id));

  protected readonly fileList = computed(() =>
    this.files.hasValue() ? (this.files.value() ?? []) : [],
  );

  protected readonly canAddFiles = computed(() => this.fileList().length < MAX_TASK_FILES);

  private readonly hourList = viewChild<ElementRef<HTMLElement>>('hourList');
  private readonly minuteList = viewChild<ElementRef<HTMLElement>>('minuteList');

  private readonly loaded = signal<string | null>(null);

  constructor() {
    effect(() => {
      const current = this.task();
      if (!current || untracked(this.loaded) === current.id) return;

      this.loaded.set(current.id);
      this.draft.set(toDraft(current));
    });

    inject(DestroyRef).onDestroy(() => void this.commit());
  }

  protected readonly dueDate = computed<Date | undefined>(() => {
    const key = this.draft().dueDate;
    return key ? (fromDateKey(key) ?? undefined) : undefined;
  });

  protected readonly inMyDay = computed(() => {
    const current = this.task();
    return current ? isInMyDay(current, this.today) : false;
  });

  private readonly today = toDateKey(new Date());

  protected readonly completed = computed(() => {
    const current = this.task();
    return current ? isCompleted(current) : false;
  });

  protected async setCompleted(completed: boolean, box: HlmCheckbox): Promise<void> {
    const current = this.task();
    if (!current) return;
    try {
      await this.commands.setCompleted(current.id, completed);
    } catch {
      box.checked.set(!completed);
      toast.error(completed ? '완료하지 못했습니다.' : '되돌리지 못했습니다.');
      return;
    }
    this.changed.emit();
  }

  protected async setImportant(important: boolean): Promise<void> {
    const current = this.task();
    if (!current) return;
    await this.commands.setImportant(current.id, important);
    this.changed.emit();
  }

  protected async toggleMyDay(): Promise<void> {
    const current = this.task();
    if (!current) return;

    await this.commands.setMyDay(current.id, !this.inMyDay());
    this.changed.emit();
  }

  protected readonly draftDueDate = computed(() => this.draft().dueDate);

  protected readonly quickDue = computed(() =>
    quickDues(fromDateKey(this.today) ?? new Date()).map((q, index) => ({
      ...q,
      icon: DUE_ICONS[index],
    })),
  );

  protected pickQuick(date: Date, picker: { close(): void }): void {
    this.setDueDate(date);
    picker.close();
  }

  protected readonly quickRemind = computed(() =>
    quickReminds(this.now).map((q, index) => ({ ...q, icon: REMIND_ICONS[index] })),
  );

  private readonly now = new Date();

  protected readonly draftRemindAt = computed(() => this.draft().remindAt);

  protected readonly remindDate = computed<Date | undefined>(() => {
    const at = this.draft().remindAt;
    return at ? (fromDateTimeKey(at) ?? undefined) : undefined;
  });

  protected readonly remindTime = computed(() => {
    const at = this.draft().remindAt;
    return at ? remindTimeKey(at) : null;
  });

  protected readonly remindParts = computed(() =>
    splitTime(this.remindTime() ?? DEFAULT_REMIND_TIME),
  );

  protected readonly meridiems = MERIDIEMS;
  protected readonly hours12 = HOURS12;
  protected readonly minutes = MINUTES;

  protected setRemindMeridiem(meridiem: Meridiem): void {
    const { hour12, minute } = this.remindParts();
    this.setRemindTime(joinTime(meridiem, hour12, minute));
  }

  protected setRemindHour(hour12: number): void {
    const { meridiem, minute } = this.remindParts();
    this.setRemindTime(joinTime(meridiem, hour12, minute));
  }

  protected setRemindMinute(minute: string): void {
    const { meridiem, hour12 } = this.remindParts();
    this.setRemindTime(joinTime(meridiem, hour12, minute));
  }

  protected readonly formatRemind = (date: Date): string =>
    `알림 ${describeRemind(withRemindDate(this.draft().remindAt, date, DEFAULT_REMIND_TIME), this.today)}`;

  protected setRemindDate(date: Date | null): void {
    this.setRemindAt(
      date ? withRemindDate(this.draft().remindAt, date, DEFAULT_REMIND_TIME) : null,
    );
  }

  protected setRemindTime(time: string): void {
    this.setRemindAt(withRemindTime(this.draft().remindAt, time, this.today));
  }

  protected pickQuickRemind(at: string, picker: { close(): void }): void {
    this.setRemindAt(at);
    picker.close();
  }

  protected scrollToRemindTime(): void {
    requestAnimationFrame(() => {
      const { hour12, minute } = this.remindParts();
      center(this.hourList()?.nativeElement, hour12 - 1);
      center(this.minuteList()?.nativeElement, Number(minute));
    });
  }

  protected setRemindAt(at: string | null): void {
    this.draft.update((draft) => ({ ...draft, remindAt: at }));
    void this.commit();
  }

  protected setDueDate(date: Date | null): void {
    this.draft.update((draft) => ({ ...draft, dueDate: date ? toDateKey(date) : null }));
    void this.commit();
  }

  protected commitOnEnter(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.isComposing) return;

    event.preventDefault();
    void this.commit();
  }

  protected cancelOnEscape(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || event.isComposing) return;

    const current = this.task();
    if (!current) return;

    event.preventDefault();
    this.draft.set(toDraft(current));
    this.editForm().reset();
  }

  protected async commit(): Promise<void> {
    const current = this.task();
    if (!current) return;

    this.editForm().markAsTouched();
    if (!this.editForm().valid()) return;

    const next = this.draft();
    const unchanged =
      next.title.trim() === current.title &&
      next.note === current.note &&
      next.dueDate === current.dueDate &&
      next.remindAt === current.remindAt;
    if (unchanged) return;

    try {
      await this.commands.update(current.id, next);
    } catch {
      this.draft.set(toDraft(current));
      this.editForm().reset();
      toast.error('바꾸지 못했습니다.');
      return;
    }
    this.changed.emit();
  }

  protected async remove(): Promise<void> {
    const current = this.task();
    if (!current) return;

    this.confirm()?.close();
    await this.commands.remove(current.id);
    this.changed.emit();

    this.close();
  }

  protected addFiles(): void {
    const current = this.task();
    if (!current) return;

    openUppyDialog({
      maxNumberOfFiles: MAX_TASK_FILES - this.fileList().length,
      maxFileSize: MAX_TASK_FILE_BYTES,
      note: '작업당 5개, 각 10MB 이하',
      presign: (file) => this.commands.presignFile(current.id, file.name, file.type, file.size),
      attach: async (objectKey, file) => {
        await this.commands.attachFile(current.id, objectKey, file.name, file.type);
      },
      onCompleted: () => this.files.reload(),
      onAttachError: (message) => toast.error(message),
    });
  }

  protected async removeFile(fileId: string): Promise<void> {
    const current = this.task();
    if (!current) return;

    try {
      await this.commands.detachFile(current.id, fileId);
    } catch (error) {
      toast.error(problemDetail(error, '파일을 떼지 못했습니다.'));
      return;
    }
    this.files.reload();
  }

  protected formatFileSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${bytes}B`;
  }

  protected close(): void {
    void this.router.navigate([], {
      queryParams: TASK_PANEL.close(),
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}

const MAX_TASK_FILES = 5;

const MAX_TASK_FILE_BYTES = 10 * 1024 * 1024;

const DUE_ICONS = ['lucideCalendarCheck', 'lucideCalendarArrowDown', 'lucideCalendarRange'];

const REMIND_ICONS = ['lucideClock', 'lucideCircleArrowRight', 'lucideChevronsRight'];

function toDraft(task: Task): TaskDraft {
  return {
    title: task.title,
    note: task.note,
    dueDate: task.dueDate,
    remindAt: task.remindAt,
  };
}

function center(list: HTMLElement | undefined, index: number): void {
  const item = list?.children.item(index) as HTMLElement | null;
  if (list && item) {
    list.scrollTop = item.offsetTop - list.clientHeight / 2 + item.offsetHeight / 2;
  }
}
