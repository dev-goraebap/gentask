import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { form, FormField, FormRoot, requiredError, validate } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucideChevronRight } from '@ng-icons/lucide';
import { HlmButton } from '@/shared/ui/button';
import { HlmCheckbox } from '@/shared/ui/checkbox';
import { AppIcon } from '@/shared/ui/icon';
import { HlmInput } from '@/shared/ui/input';
import { TASK_STORE } from '../api/task-store';
import { isAddableTitle, splitByCompletion, type Task } from '../model/task';

/**
 * 할일 목록 화면입니다. 요구사항 1(빠르게 적어 둔다)과 2(해낸 것을 표시하고 되돌린다)를 담습니다.
 *
 * 데이터는 TASK_STORE 인터페이스 뒤에서만 접근합니다. 목데이터를 여기 박지 않는 이유는
 * 백엔드 연결을 프로바이더 교체로 축소하기 위함입니다. 09-state.md 2절.
 */
@Component({
  selector: 'app-task-list',
  imports: [FormRoot, FormField, HlmButton, HlmInput, HlmCheckbox, AppIcon],
  providers: [provideIcons({ lucideChevronRight })],
  templateUrl: './task-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskList {
  /**
   * 완료 섹션의 펼침 상태입니다. 쿼리 파라미터에 두어 새로고침과 링크 공유가
   * 별도 구현 없이 동작합니다. 08-routing.md 3절.
   */
  readonly done = input(false, { transform: booleanAttribute });

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

  protected readonly groups = computed(() => splitByCompletion(this.store.tasks()));

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
