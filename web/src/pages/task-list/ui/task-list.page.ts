import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { form, FormField, FormRoot, requiredError, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucideChevronRight, lucideTrash2 } from '@ng-icons/lucide';
import { ROUTES } from '@/shared/config';
import { HlmButton } from '@/shared/ui/button';
import { HlmCheckbox } from '@/shared/ui/checkbox';
import { HlmField, HlmFieldError, HlmFieldLabel } from '@/shared/ui/field';
import { AppIcon } from '@/shared/ui/icon';
import { HlmInput } from '@/shared/ui/input';
import { HlmToaster, toast } from '@/shared/ui/sonner';
import {
  formatDueDate,
  isAddableTitle,
  isOverdue,
  sortActive,
  sortCompleted,
  splitByCompletion,
  TASK_STORE,
  toDateKey,
  toTaskSort,
  type Task,
  type TaskSort,
} from '@/entities/task';

/**
 * 할일 목록 화면입니다. 요구사항 1(빠르게 적어 둔다)·2(해낸 것을 표시하고 되돌린다)·4(지운다)·5(좁혀 본다)를 담습니다.
 *
 * 데이터는 TASK_STORE 인터페이스 뒤에서만 접근합니다. 목데이터를 여기 박지 않는 이유는
 * 백엔드 연결을 프로바이더 교체로 축소하기 위함입니다. 09-state.md 2절.
 */
@Component({
  selector: 'app-task-list',
  imports: [
    FormRoot, FormField, RouterLink,
    HlmButton, HlmInput, HlmCheckbox, AppIcon, HlmField, HlmFieldLabel, HlmFieldError, HlmToaster,
  ],
  providers: [provideIcons({ lucideChevronRight, lucideTrash2 })],
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

  protected readonly routes = ROUTES;

  private readonly store = inject(TASK_STORE);
  private readonly router = inject(Router);

  private readonly draft = signal({ title: '' });

  /**
   * 검증 규칙을 스키마 한 곳에 모읍니다. 컴포넌트 여기저기의 조건문으로 검증하면
   * 규칙 위치가 일의적이지 않게 됩니다. 12-forms.md 2절.
   */
  protected readonly addForm = form(this.draft, (p) => {
    validate(p.title, ({ value }) =>
      isAddableTitle(value()) ? undefined : requiredError({ message: '할 일을 입력해 주세요.' }),
    );
  });

  protected readonly groups = computed(() => {
    const { active, completed } = splitByCompletion(this.store.tasks());
    return { active: sortActive(active, this.sort()), completed: sortCompleted(completed) };
  });

  protected readonly sortOptions = SORT_OPTIONS;

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
   * (submit) 에 바인딩하고 preventDefault 를 직접 호출합니다. (ngSubmit) 은 Reactive Forms 의
   * formGroup 디렉티브가 제공하는 출력이라 여기서는 발화하지 않으며, 없는 채로 쓰면
   * 빌드가 통과하고 제출만 조용히 동작하지 않습니다. 12-forms.md 1절.
   */
  protected async add(event: Event): Promise<void> {
    event.preventDefault();

    // 검증 실패로 버튼을 비활성화하지 않습니다. 누르면 오류를 보여 주는 편이 안내가 명확합니다.
    // 12-forms.md 6절.
    this.addForm().markAsTouched();
    if (!this.addForm().valid()) return;

    await this.store.add(this.draft().title);
    this.draft.set({ title: '' });
  }

  protected async setCompleted(task: Task, completed: boolean): Promise<void> {
    await this.store.setCompleted(task.id, completed);
  }

  /**
   * 지우고 되돌릴 수단을 함께 냅니다. 요구사항 4.
   *
   * 확인 대화 대신 실행 취소를 고른 것은, 지우기가 반복되는 조작이라 매번 막으면 흐름이
   * 끊기기 때문입니다. 부록 B 의 `삭제 복구` 가 미해결이므로 이 화면이 그 자리를 임시로
   * 채우며, 되돌릴 값은 여기서 들고 있다가 저장소에 되돌립니다.
   *
   * 한계는 안내가 사라지면 되돌릴 수 없다는 것입니다. 새로고침이나 화면 이동도 같습니다.
   * 영구적인 복구가 필요한지는 스펙 심화에서 정합니다.
   */
  protected async remove(task: Task): Promise<void> {
    await this.store.remove(task.id);

    toast('할 일을 지웠습니다', {
      description: task.title,
      action: { label: '되돌리기', onClick: () => void this.store.restore(task) },
    });
  }

  /**
   * 정렬 변경은 상태 갱신이 아니라 이동입니다. 08-routing.md 3.2절.
   *
   * 기본값은 주소에서 뺍니다. `?sort=created` 가 붙은 주소와 붙지 않은 주소가 같은 화면을
   * 가리키면 공유된 링크가 두 벌이 됩니다.
   */
  protected setSort(next: TaskSort): void {
    void this.router.navigate([], {
      queryParams: { sort: next === 'created' ? null : next },
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

/** 화면에 나열할 정렬 기준입니다. 순서가 곧 버튼 순서입니다. */
const SORT_OPTIONS: readonly { readonly value: TaskSort; readonly label: string }[] = [
  { value: 'created', label: '추가순' },
  { value: 'due', label: '마감일순' },
];
