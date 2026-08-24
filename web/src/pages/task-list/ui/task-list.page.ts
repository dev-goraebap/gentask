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
  formatDueDate,
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
  TaskCommands,
  TaskList,
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
  type TaskSeed,
  type TaskSort,
  type TaskView,
} from '@/entities/task';

/**
 * 작업 목록 화면입니다. TK-001 작업 추가, TK-002 작업 보기, TK-004 작업 완료의 기본 흐름과
 * TK-003 A4(중요 표시)를 담습니다.
 *
 * 관점 넷이 같은 화면을 씁니다. 관점마다 화면을 두면 목록·정렬·추가가 네 벌이 되고,
 * 실제로 다른 것은 무엇을 담을지 고르는 조건 하나뿐입니다.
 *
 * 지우기는 이 화면에 없습니다. 파괴적 조작이 줄마다 상시 노출되지 않도록 상세 패널이
 * 소유하며, 확인 대화를 거칩니다. 기각한 대안(별도 페이지)은 shared/config/routes.ts 의 TASK_PANEL 주석에 있습니다.
 *
 * 목록은 라우트 스코프의 TaskList 가 들고 있고 변경은 TaskCommands 가 보냅니다.
 * 변경이 성공하면 이 화면이 reload() 를 불러 사본을 다시 받습니다. 09-state.md 4.1절.
 */
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
  /*
   * 셸이 준 높이를 채웁니다. 자리와 폭은 셸이 정하며 이 클래스는 그 안에서 적는 자리를
   * 바닥으로 밀어내는 역할만 합니다. 06-layout.md 3.2절.
   */
  host: {
    class: 'flex min-h-0 flex-1 flex-col',
    // 대기 사실을 보조 기술에 알립니다. 13-accessibility.md 7절.
    '[attr.aria-busy]': 'veil().visible() || null',
  },
  templateUrl: './task-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListPage {
  /**
   * 완료 섹션의 펼침 상태입니다. 쿼리 파라미터에 두어 새로고침과 링크 공유가
   * 별도 구현 없이 동작합니다. 08-routing.md 3절.
   */
  readonly done = input(false, { transform: booleanAttribute });

  /**
   * 미완료 목록의 정렬 기준입니다. 08-routing.md 3절이 정렬을 주소에 두도록 정합니다.
   * 새로고침 복원과 링크 공유가 별도 구현 없이 동작합니다.
   */
  /**
   * 주소의 정렬 값입니다. 날것을 받는 이유는 "고르지 않음" 과 "만든 날짜를 골랐음" 을
   * 가르기 위해서입니다. 둘은 같은 순서이지만 후자만 칩을 보입니다.
   */
  readonly sort = input<string | undefined>(undefined);

  protected readonly sortKey = computed<TaskSort>(() => toTaskSort(this.sort()));

  /** 방향입니다. 주소에 없으면 그 기준의 기본 방향입니다. */
  readonly dir = input<string | undefined>(undefined);

  protected readonly direction = computed<SortDirection>(() =>
    toSortDirection(this.dir(), this.sortKey()),
  );

  /**
   * 무엇을 볼지 정하는 관점입니다. 이름은 경로 파라미터와 같아야 입력 바인딩이 묶입니다.
   *
   * 관점이 경로에 있는 이유는 그것이 이동이기 때문입니다. 08-routing.md 3절.
   */
  readonly view = input<TaskView, string | undefined>('all', { transform: toTaskView });

  /**
   * 상세 패널이 열어 둔 항목입니다. 이름은 TASK_PANEL.param 과 같아야 입력 바인딩이 묶입니다.
   *
   * 경로가 아니라 쿼리 파라미터인 이유는 목록을 곁에 두기 위해서입니다. 경로가 바뀌면
   * 라우터가 목록을 언마운트하고 전환 베일이 목록을 덮습니다.
   */
  readonly task = input<string | undefined>(undefined);

  protected readonly routes = ROUTES;

  protected readonly taskList = inject(TaskList);
  private readonly commands = inject(TaskCommands);
  private readonly router = inject(Router);

  /**
   * 베일은 최초 조회에만 띄웁니다. `reloading` 은 이전 값이 화면에 남아 있어 덮을 이유가
   * 없고, 덮으면 방금 누른 컨트롤이 가려집니다. 09-state.md 3.3절 · 10-loading.md 3.2절.
   */
  protected readonly listLoading = computed(() => this.taskList.status() === 'loading');

  /** 실패는 빈 목록이 아니라 실패로 보입니다. 15-error-handling.md 3.2절. */
  protected readonly listFailed = computed(() => this.taskList.status() === 'error');

  protected readonly veil = viewChild.required(Veil);

  private readonly draft = signal({ title: '' });

  /**
   * 적으면서 붙인 기한과 미리 알림입니다. TK-001 A2 · A3.
   *
   * 폼에 두지 않고 따로 갖습니다. `form()` 이 관리하는 것은 사용자가 타이핑하는 값이고
   * 이 둘은 팝오버에서 고르는 값이라, 폼에 넣으면 검증과 touched 를 쓰지 않는 필드가
   * 스키마에 끼어듭니다. 비우는 시점만 제목과 같이 맞춥니다.
   */
  private readonly draftDue = signal<string | null>(null);
  private readonly draftRemind = signal<string | null>(null);

  /**
   * 검증 스키마를 두지 않습니다. 12-forms.md 2절이 규칙을 스키마에 모으라고 정하지만,
   * 그것은 사용자에게 알릴 오류가 있는 폼의 이야기입니다.
   *
   * 이 자리는 화면이 서 있는 동안 대부분 비어 있고, 비어 있는 것은 잘못이 아니라 아직
   * 적지 않은 상태입니다. 스키마에 규칙을 두면 폼이 처음부터 invalid 가 되어 붉은 테두리가
   * 상시 걸립니다. 추가 조건은 add 가 직접 봅니다.
   */
  protected readonly addForm = form(this.draft);

  /** 관점이 고른 뒤에 완료 여부로 가릅니다. 순서는 그다음입니다. */
  protected readonly groups = computed(() => {
    const chosen = filterByView(this.taskList.tasks(), this.view(), this.today);
    const { active, completed } = splitByCompletion(chosen);
    return {
      active: sortActive(active, this.sortKey(), this.direction()),
      completed: sortCompleted(completed),
    };
  });

  /** 화면 제목입니다. 네비게이션의 항목 이름과 같은 값을 씁니다. */
  protected readonly title = computed(() => taskViewLabel(this.view()));

  /**
   * 빈 관점에 내는 문구입니다. 관점마다 비어 있는 이유가 달라 한 문장으로 덮지 않습니다.
   *
   * 무엇을 보여줄지는 TK-002 A5 가 정합니다. 여기서는 다음 행동을 적는
   * 것으로 두었고, 그 판단은 스펙 심화에서 정합니다.
   */
  protected readonly emptyMessage = computed(() => EMPTY_MESSAGES[this.view()]);

  /**
   * 적는 자리가 놓인 관점이 새 항목에 부여하는 성질입니다.
   *
   * 관점 안에서 적은 항목이 그 관점에 나타나지 않으면 적은 사람은 사라진 것으로 봅니다.
   * 계획된 일정에 기한을 오늘로 두는 것도 같은 이유이며, 그 자리는 기한이 있는 것만
   * 담기 때문입니다.
   */
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

  /**
   * 관점이 주는 성질 위에 적으면서 고른 값을 얹습니다. 고른 것이 이깁니다.
   *
   * 계획된 일정은 기한을 오늘로 씨앗에 넣는데, 그 자리에서 다른 날을 고른 사용자에게는
   * 고른 날이 반영되어야 합니다. 관점의 기본값이 사용자의 선택을 덮으면 고르는 일 자체가
   * 뜻을 잃습니다.
   */
  protected readonly seed = computed<TaskSeed>(() => {
    const due = this.draftDue();
    const remind = this.draftRemind();
    return {
      ...this.viewSeed(),
      ...(due !== null ? { dueDate: due } : {}),
      ...(remind !== null ? { remindAt: remind } : {}),
    };
  });

  /** 적는 자리의 기한입니다. 달력에 넘길 값과 지우기 버튼의 표시 조건입니다. */
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

  /**
   * 빠른 선택입니다. 고를 수 있는 값은 엔티티가 정하고 아이콘만 여기서 붙입니다.
   * 상세 패널과 같은 함수를 거치므로 두 자리에서 고를 수 있는 날이 어긋나지 않습니다.
   */
  protected readonly quickDue = computed(() =>
    quickDues(this.now).map((q, index) => ({ ...q, icon: DUE_ICONS[index] })),
  );

  protected readonly quickRemind = computed(() =>
    quickReminds(this.now).map((q, index) => ({ ...q, icon: REMIND_ICONS[index] })),
  );

  private readonly now = new Date();

  /**
   * 미리 알림 칩에 적을 문구입니다. 달력은 날짜만 아는데 이 값은 시각까지 갖습니다.
   *
   * 앞에 "알림" 을 붙이는 이유는 값이 정해지면 트리거가 아이콘 대신 이 문구를 보이기
   * 때문입니다. 시각만 남으면 그것이 기한인지 알림인지 구별되지 않습니다. 기한 쪽은
   * "~까지" 가 그 구실을 하므로 따로 붙이지 않습니다.
   */
  protected readonly formatRemindChip = (date: Date): string =>
    `알림 ${describeRemind(withRemindDate(this.draftRemind(), date, DEFAULT_REMIND_TIME), this.today)}`;

  /** 달력에서 고른 날입니다. 이미 정한 시각이 있으면 지킵니다. */
  protected setDraftRemindDate(date: Date | null): void {
    this.draftRemind.set(
      date ? withRemindDate(this.draftRemind(), date, DEFAULT_REMIND_TIME) : null,
    );
  }

  protected setDraftDue(date: Date | null): void {
    this.draftDue.set(date ? toDateKey(date) : null);
  }

  /** 빠른 선택은 달력을 거치지 않으므로 팝오버를 직접 닫습니다. 상세와 같은 규칙입니다. */
  protected pickQuickDue(date: Date, picker: { close(): void }): void {
    this.setDraftDue(date);
    picker.close();
  }

  protected pickQuickRemind(at: string, picker: { close(): void }): void {
    this.draftRemind.set(at);
    picker.close();
  }

  protected readonly sortOptions = TASK_SORTS;

  /**
   * 정렬이 기본(만든 날짜 · 최근 것 앞)에서 벗어났는지입니다. 벗어났을 때만 칩을 보입니다.
   * 기본 상태에 칩이 늘 떠 있으면 "정렬 중" 이라는 신호가 값싸집니다.
   */
  protected readonly sortActive = computed(
    () => this.sort() !== undefined || this.dir() !== undefined,
  );

  protected readonly sortChip = computed(
    () => TASK_SORTS.find((s) => s.value === this.sortKey())?.chip ?? '',
  );

  /** 칩의 화살표는 방향을 뒤집고, × 는 정렬을 기본으로 되돌립니다. */
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

  protected readonly panel = TASK_PANEL;

  /**
   * 상세 패널에 넘길 항목입니다. 찾는 것은 부모의 몫이며, 패널은 목록의 조회를 모른 채
   * 값 하나를 받아 (changed) 로만 알립니다.
   */
  protected readonly openTask = computed<Task | undefined>(() => {
    const id = this.task();
    return id ? this.taskList.tasks().find((candidate) => candidate.id === id) : undefined;
  });

  /**
   * 지난 기한 판정의 기준일입니다. 화면이 서 있는 동안 자정을 넘기면 낡은 값이 되지만,
   * 목데이터 위의 프로토타입에서 그 경계를 다루는 장치를 먼저 만들 근거가 없습니다.
   * 관점 스펙이 하루의 경계를 정할 때 이 값의 소유도 함께 정합니다.
   */
  private readonly today = toDateKey(new Date());

  protected readonly formatDueDate = formatDueDate;

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

  /** 목록 행에 적는 미리 알림입니다. 오늘이면 시각만 나옵니다. */
  protected describeRemind(at: string): string {
    return describeRemind(at, this.today);
  }

  /**
   * 알릴 시각이 지났는지입니다. 지난 기한과 같은 취급이며, 색과 문구를 함께 씁니다.
   * 기준은 화면이 선 시점입니다. 지난 기한의 기준일과 같은 한계를 갖습니다.
   */
  protected isRemindPast(task: Task): boolean {
    return isRemindPast(task, toDateTimeKey(this.now));
  }

  /**
   * 엔터가 곧 추가입니다. 등록 버튼을 두지 않는 사유는 템플릿에 적혀 있습니다.
   *
   * 조합 중의 엔터는 추가 신호가 아닙니다. 한글은 마지막 글자를 조합한 채로 엔터를 눌러
   * 확정하는 일이 흔한데, 그것을 추가로 받으면 조합이 끝나기 전의 글자가 항목이 됩니다.
   * 이 판정은 사용자가 무엇을 눌렀는지가 아니라 입력기가 그 키를 이미 썼는지를 봅니다.
   */
  protected addOnEnter(event: KeyboardEvent): void {
    /*
     * 의사 이벤트 `(keydown.enter)` 대신 keydown 을 받고 키를 여기서 봅니다. 그쪽은
     * `$event` 가 Event 로 잡혀 조합 여부를 읽으려면 캐스트가 필요합니다.
     */
    if (event.key !== 'Enter' || event.isComposing) return;

    // 막지 않으면 입력란이 하나뿐인 폼이 암묵 제출되어 화면이 통째로 다시 뜹니다.
    event.preventDefault();
    void this.add();
  }

  private async add(): Promise<void> {
    // 공백만 적은 것은 제목이 아닙니다. 알리지 않고 아무 일도 하지 않습니다.
    if (!isAddableTitle(this.draft().title)) return;

    try {
      await this.commands.add(this.draft().title, this.seed());
    } catch {
      /*
       * 남기지 못했음을 알리고 적은 것은 그대로 둡니다. TK-001 A6. 비우면 사용자가 다시
       * 적어야 하고, 다시 적겠다고 하는 것이 곧 재시도입니다.
       */
      toast.error('작업을 추가하지 못했습니다.', {
        action: { label: '다시 시도', onClick: () => void this.add() },
      });
      return;
    }

    // 명령은 결과를 싣지 않습니다. 적은 것이 목록에 보이려면 사본을 다시 받아야 합니다.
    this.taskList.reload();

    /*
     * 다음 항목을 이어 적을 수 있게 비웁니다. 붙인 기한과 미리 알림도 함께 비웁니다.
     * 남겨 두면 다음에 적는 항목이 앞의 것과 같은 날짜를 조용히 물려받습니다.
     */
    this.addForm().reset({ title: '' });
    this.draftDue.set(null);
    this.draftRemind.set(null);
  }

  /**
   * 실패하면 체크박스를 누르기 전으로 되돌립니다. TK-004 A4.
   *
   * 체크박스는 자기 표시를 갖고, 입력값이 그대로면 다시 그리지 않습니다. 그래서 입력값을
   * 바꾸는 것으로는 되돌릴 수 없고 그 표시를 직접 되돌립니다.
   */
  protected async setCompleted(task: Task, completed: boolean, box: HlmCheckbox): Promise<void> {
    /*
     * 체크된 모습을 먼저 보여 준 뒤 옮깁니다. 곧바로 갱신하면 행 제거와 체크 표시가 같은
     * 변경 감지에 몰려 체크가 그려지기 전에 행이 떠나고, 누른 결과를 볼 새가 없습니다.
     * MS To Do 도 같은 간격을 둡니다.
     */
    await new Promise((resolve) => setTimeout(resolve, CHECK_DWELL_MS));
    try {
      await this.commands.setCompleted(task.id, completed);
    } catch {
      box.checked.set(!completed);
      toast.error(completed ? '완료하지 못했습니다.' : '되돌리지 못했습니다.');
      return;
    }
    this.taskList.reload();
  }

  /** 중요 표시를 켜고 끕니다. TK-003 A4. */
  protected async setImportant(task: Task, important: boolean): Promise<void> {
    await this.commands.setImportant(task.id, important);
    this.taskList.reload();
  }

  /**
   * 정렬 변경은 상태 갱신이 아니라 이동입니다. 08-routing.md 3.2절.
   *
   * 기본값은 주소에서 뺍니다. `?sort=created` 가 붙은 주소와 붙지 않은 주소가 같은 화면을
   * 가리키면 공유된 링크가 두 벌이 됩니다.
   */
  protected setSort(next: TaskSort): void {
    // 같은 기준을 다시 고르면 방향을 뒤집습니다. 다른 기준이면 그 기준의 기본 방향입니다.
    const direction: SortDirection =
      next === this.sortKey()
        ? this.direction() === 'asc'
          ? 'desc'
          : 'asc'
        : DEFAULT_DIRECTION[next];
    // 고른 기준은 기본값이어도 주소에 남깁니다. 그래야 "골랐다" 는 사실이 칩으로 보입니다.
    void this.router.navigate([], {
      queryParams: {
        sort: next,
        dir: direction === DEFAULT_DIRECTION[next] ? null : direction,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /**
   * 펼침은 값의 변경이지 이동이 아니므로 히스토리를 쌓지 않습니다. 쌓으면 뒤로가기가
   * 섹션 여닫기로 소모됩니다. 08-routing.md 3.2절.
   */
  protected toggleCompleted(): void {
    void this.router.navigate([], {
      queryParams: { done: this.done() ? null : 1 },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}

/** 관점마다 비어 있을 때의 안내입니다. */
/** 체크된 모습을 보여 주는 시간입니다. 퇴장 애니메이션은 이 뒤에 시작합니다. */
const CHECK_DWELL_MS = 240;

const EMPTY_MESSAGES: Record<TaskView, string> = {
  'my-day': '오늘 할 것으로 담은 항목이 없습니다. 항목을 열어 나의 하루에 담아 보세요.',
  important: '중요 표시를 켠 항목이 없습니다. 목록에서 별을 눌러 표시할 수 있습니다.',
  planned: '기한을 정한 항목이 없습니다. 항목을 열어 기한을 정해 보세요.',
  all: '작업이 없습니다. 아래에 입력해 하나 추가해 보세요.',
};

/** 기한 빠른 선택의 아이콘입니다. 엔티티가 주는 순서(오늘 · 내일 · 다음 주)와 자리를 맞춥니다. */
const DUE_ICONS = ['lucideCalendarCheck', 'lucideCalendarArrowDown', 'lucideCalendarRange'];

/** 미리 알림 빠른 선택의 아이콘입니다. 순서는 오늘 나중에 · 내일 · 다음 주입니다. */
const REMIND_ICONS = ['lucideClock', 'lucideCircleArrowRight', 'lucideChevronsRight'];
