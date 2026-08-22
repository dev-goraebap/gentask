import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { form, FormField, FormRoot } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucideArrowDown, lucideArrowUp, lucideChevronRight, lucideStar } from '@ng-icons/lucide';
import { ROUTES, TASK_PANEL } from '@/shared/config';
import { AsideOutlet } from '@/shared/lib';
import { HlmButton } from '@/shared/ui/button';
import { HlmCheckbox } from '@/shared/ui/checkbox';
import { HlmField, HlmFieldLabel } from '@/shared/ui/field';
import { AppIcon } from '@/shared/ui/icon';
import { HlmInput } from '@/shared/ui/input';
import { toast } from '@/shared/ui/sonner';
import { TaskDetailPanel } from './task-detail-panel';
import {
  filterByView,
  formatDueDate,
  isAddableTitle,
  isOverdue,
  sortActive,
  sortCompleted,
  splitByCompletion,
  TASK_STORE,
  taskViewLabel,
  toDateKey,
  toTaskSort,
  toSortDirection,
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
 * 할일 목록 화면입니다. TK-001 할일 적어두기, TK-002 지금 할 일 보기, TK-004 할일 마치기의 기본 흐름과
 * TK-003 A4(중요 표시)를 담습니다.
 *
 * 관점 넷이 같은 화면을 씁니다. 관점마다 화면을 두면 목록·정렬·추가가 네 벌이 되고,
 * 실제로 다른 것은 무엇을 담을지 고르는 조건 하나뿐입니다.
 *
 * 지우기는 이 화면에 없습니다. 파괴적 조작이 줄마다 상시 노출되지 않도록 상세 패널이
 * 소유하며, 확인 대화를 거칩니다. 기각한 대안(별도 페이지)은 shared/config/routes.ts 의 TASK_PANEL 주석에 있습니다.
 *
 * 데이터는 TASK_STORE 인터페이스 뒤에서만 접근합니다. 목데이터를 여기 박지 않는 이유는
 * 백엔드 연결을 프로바이더 교체로 축소하기 위함입니다. 09-state.md 2절.
 */
@Component({
  selector: 'app-task-list',
  imports: [
    FormRoot,
    FormField,
    RouterLink,
    HlmButton,
    HlmInput,
    HlmCheckbox,
    AppIcon,
    HlmField,
    HlmFieldLabel,
    TaskDetailPanel,
    AsideOutlet,
  ],
  providers: [provideIcons({ lucideArrowDown, lucideArrowUp, lucideChevronRight, lucideStar })],
  /*
   * 셸이 준 높이를 채웁니다. 자리와 폭은 셸이 정하며 이 클래스는 그 안에서 적는 자리를
   * 바닥으로 밀어내는 역할만 합니다. 06-layout.md 3.2절.
   */
  host: { class: 'flex min-h-0 flex-1 flex-col' },
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
  readonly sort = input<TaskSort, string | undefined>('created', { transform: toTaskSort });

  /** 방향입니다. 주소에 없으면 그 기준의 기본 방향입니다. */
  readonly dir = input<string | undefined>(undefined);

  protected readonly direction = computed<SortDirection>(() =>
    toSortDirection(this.dir(), this.sort()),
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

  private readonly store = inject(TASK_STORE);
  private readonly router = inject(Router);

  private readonly draft = signal({ title: '' });

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
    const chosen = filterByView(this.store.tasks(), this.view(), this.today);
    const { active, completed } = splitByCompletion(chosen);
    return {
      active: sortActive(active, this.sort(), this.direction()),
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
   * 계획된 일정에 마감일을 오늘로 두는 것도 같은 이유이며, 그 자리는 마감일이 있는 것만
   * 담기 때문입니다.
   */
  protected readonly seed = computed<TaskSeed>(() => {
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

  protected readonly sortOptions = TASK_SORTS;

  protected readonly panel = TASK_PANEL;

  /**
   * 지난 마감일 판정의 기준일입니다. 화면이 서 있는 동안 자정을 넘기면 낡은 값이 되지만,
   * 목데이터 위의 프로토타입에서 그 경계를 다루는 장치를 먼저 만들 근거가 없습니다.
   * 관점 스펙이 하루의 경계를 정할 때 이 값의 소유도 함께 정합니다.
   */
  private readonly today = toDateKey(new Date());

  protected readonly formatDueDate = formatDueDate;

  protected isOverdue(task: Task): boolean {
    return isOverdue(task, this.today);
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
      await this.store.add(this.draft().title, this.seed());
    } catch {
      /*
       * 남기지 못했음을 알리고 적은 것은 그대로 둡니다. TK-001 A6. 비우면 사용자가 다시
       * 적어야 하고, 다시 적겠다고 하는 것이 곧 재시도입니다.
       */
      toast.error('할 일을 남기지 못했습니다.', {
        action: { label: '다시 시도', onClick: () => void this.add() },
      });
      return;
    }

    // 다음 항목을 이어 적을 수 있게 비웁니다.
    this.addForm().reset({ title: '' });
  }

  /**
   * 실패하면 체크박스를 누르기 전으로 되돌립니다. TK-004 A4.
   *
   * 체크박스는 자기 표시를 갖고, 입력값이 그대로면 다시 그리지 않습니다. 그래서 입력값을
   * 바꾸는 것으로는 되돌릴 수 없고 그 표시를 직접 되돌립니다.
   */
  protected async setCompleted(task: Task, completed: boolean, box: HlmCheckbox): Promise<void> {
    try {
      await this.store.setCompleted(task.id, completed);
    } catch {
      box.checked.set(!completed);
      toast.error(completed ? '마치지 못했습니다.' : '되돌리지 못했습니다.');
    }
  }

  /** 중요 표시를 켜고 끕니다. TK-003 A4. */
  protected async setImportant(task: Task, important: boolean): Promise<void> {
    await this.store.setImportant(task.id, important);
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
      next === this.sort()
        ? this.direction() === 'asc'
          ? 'desc'
          : 'asc'
        : DEFAULT_DIRECTION[next];
    void this.router.navigate([], {
      queryParams: {
        sort: next === 'created' ? null : next,
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
const EMPTY_MESSAGES: Record<TaskView, string> = {
  'my-day': '오늘 할 것으로 담은 항목이 없습니다. 항목을 열어 내 하루에 담아 보세요.',
  important: '중요 표시를 켠 항목이 없습니다. 목록에서 별을 눌러 표시할 수 있습니다.',
  planned: '마감일을 정한 항목이 없습니다. 항목을 열어 마감일을 정해 보세요.',
  all: '적어 둔 할 일이 없습니다. 아래에 입력해 하나 만들어 보세요.',
};

/** 화면에 나열할 정렬 기준입니다. 순서가 곧 버튼 순서입니다. */
const SORT_OPTIONS: readonly { readonly value: TaskSort; readonly label: string }[] = [
  { value: 'created', label: '추가순' },
  { value: 'due', label: '마감일순' },
];
